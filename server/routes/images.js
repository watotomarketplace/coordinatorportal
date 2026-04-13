import express from 'express'
import { readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const imagesDir = join(__dirname, '../../Profile Images')

// Get all profile images categorized
router.get('/profile-images', async (req, res) => {
    try {
        const categories = readdirSync(imagesDir).filter(f =>
            statSync(join(imagesDir, f)).isDirectory()
        )

        const images = {}

        categories.forEach(category => {
            const categoryPath = join(imagesDir, category)
            console.log(`Checking category: ${category} in ${categoryPath}`)
            const files = readdirSync(categoryPath).filter(f =>
                /\.(jpg|jpeg|png|webp|gif)$/i.test(f)
            )
            console.log(`Found ${files.length} images in ${category}`)

            if (files.length > 0) {
                // Use encodeURIComponent for the URL parts
                images[category] = files.map(f => `/profile-images/${encodeURIComponent(category)}/${encodeURIComponent(f)}`)
            }
        })

        res.json({ success: true, images })
    } catch (error) {
        console.error('Error listing profile images:', error)
        res.status(500).json({ success: false, message: 'Failed to list images' })
    }
})

export default router
