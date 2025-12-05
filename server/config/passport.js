import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import db, { generateId, getCurrentTimestamp } from '../db/init.js'

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id)
})

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    await db.read()
    const user = db.data.users.find(u => u.id === id)
    done(null, user)
  } catch (error) {
    done(error, null)
  }
})

// Helper function to find or create user
async function findOrCreateUser(profile, provider) {
  await db.read()
  
  let existingUser = db.data.users.find(
    u => u.provider === provider && u.provider_id === profile.id
  )

  if (existingUser) {
    return existingUser
  }

  // Create new user
  const name = profile.displayName || profile.name?.givenName || 'Unknown'
  const email = profile.emails?.[0]?.value || `${profile.id}@${provider}.local`
  const avatarUrl = profile.photos?.[0]?.value || null

  const newUser = {
    id: generateId(),
    name,
    email,
    avatar_url: avatarUrl,
    provider,
    provider_id: profile.id,
    role: 'user',
    created_at: getCurrentTimestamp()
  }

  db.data.users.push(newUser)

  // Create notification for admin about new user
  db.data.notifications.push({
    id: generateId(),
    type: 'new_user',
    message: `New user signed up: ${name} (${email})`,
    data: JSON.stringify({ userId: newUser.id, name, email }),
    is_read: 0,
    created_at: getCurrentTimestamp()
  })

  await db.write()
  return newUser
}

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:3001'}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateUser(profile, 'google')
      done(null, user)
    } catch (error) {
      done(error, null)
    }
  }))
}

// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:3001'}/api/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'photos', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateUser(profile, 'facebook')
      done(null, user)
    } catch (error) {
      done(error, null)
    }
  }))
}

export default passport
