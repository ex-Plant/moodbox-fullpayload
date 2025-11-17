// storage-adapter-import-placeholder
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { pl } from '@payloadcms/translations/languages/pl'
import { en } from '@payloadcms/translations/languages/en'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error(`❌ missing BLOB_READ_WRITE_TOKEN token`)
}

if (!process.env.PAYLOAD_SECRET) {
  throw new Error(`❌ missing PAYLOAD_SECRET token`)
}

if (!process.env.EMAIL_USER) {
  throw new Error(`❌ missing EMAIL_USER token`)
}


if (!process.env.EMAIL_PASS) {
  throw new Error(`❌ missing EMAIL_PASS token`)
}

if (!process.env.EMAIL_HOST) {
  throw new Error(`❌ missing EMAIL_HOST token`)
}

if (!process.env.CRON_SECRET) {
  throw new Error(`❌ missing CRON_SECRET token`)
}

export default buildConfig({
  // TODO: Uncomment this when we need more locales
  // localization: {
  //   locales: ['en', 'pl'], // required
  //   defaultLocale: 'pl', // required
  // },

  // this is for the admin panel
  i18n: {
    fallbackLanguage: 'pl',
    supportedLanguages: { pl, en },
    translations: {
      pl: {
        label: 'Polski',
      },
      en: {
        label: 'English',
      },
    },
  },
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || '',
    },
    migrationDir: './src/migrations',
  }),
  collections: [Pages, Posts, Media, Categories, Users],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],

  plugins: [
    ...plugins,
    vercelBlobStorage({
      collections: {
        media: true, // or whatever your media collection is called
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  email: nodemailerAdapter({
    defaultFromAddress: process.env.EMAIL_USER ?? '',
    defaultFromName: 'Moodbox admin',
    transport: nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    }),
  }),

  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
