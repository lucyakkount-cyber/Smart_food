
export async function loadFonts() {
  const webFontLoader = await import( 'webfontloader')

  webFontLoader.load({
    google: {
      api: 'https://fonts.googleapis.com/css2',
      families: ['Public+Sans:wght@300;400;500;600;700&display=swap'],
    },
  })
}
//done