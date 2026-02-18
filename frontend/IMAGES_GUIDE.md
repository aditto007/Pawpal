# How to Add Cute Animal Pictures

## Option 1: Using Online Image URLs (Current Setup)

The `pets.json` file now supports both:
- **Local images**: `images/dog.jpg` (served from `backend/src/main/resources/static/images/`)
- **Online URLs**: Full URLs like `https://images.unsplash.com/...`

### To add your own cute images:

1. **Find cute animal illustrations** from:
   - [Unsplash](https://unsplash.com/s/photos/cute-animal) - Free high-quality photos
   - [Pexels](https://www.pexels.com/search/cute%20animal/) - Free stock photos
   - [Freepik](https://www.freepik.com/search?format=search&query=cute%20animal%20illustration) - Free illustrations (requires attribution)
   - [Flaticon](https://www.flaticon.com/search?word=cute%20animal) - Free icons

2. **Copy the image URL** (right-click → Copy Image Address)

3. **Update `frontend/data/pets.json`**:
   ```json
   {
     "id": 7,
     "name": "Turtle",
     "emoji": "🐢",
     "image": "https://your-image-url-here.com/turtle.jpg"
   }
   ```

## Option 2: Adding Local Image Files

1. **Download cute animal images** (JPG, PNG, or GIF format)

2. **Save them to**: `backend/src/main/resources/static/images/`
   - Example: `backend/src/main/resources/static/images/turtle.jpg`

3. **Update `frontend/data/pets.json`**:
   ```json
   {
     "id": 7,
     "name": "Turtle",
     "emoji": "🐢",
     "image": "images/turtle.jpg"
   }
   ```

4. **Restart your Spring Boot backend** for local images to load

## Current Image Status

✅ **Has images**: Dog, Cat, Rabbit (local files)
✅ **Using online URLs**: Parrot, Hamster, Bird, Turtle, Fish

## Tips for Cute Illustrations

- Look for **cartoon-style** or **illustrated** images (not photos)
- Prefer **circular** or **square** images that fit nicely in the card
- Use **pastel colors** to match the cute theme
- Recommended size: **400x400px** or larger (will be automatically resized)

## Testing

After adding images:
1. Hard refresh your browser: `Ctrl + Shift + R`
2. Check if images load (if not, emoji will show as fallback)
3. If using local images, make sure Spring Boot backend is running

