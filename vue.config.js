let sav = ''
for (const e in process.env) {
  if (/VUE_APP_STYLE/i.test(e)) {
    sav += `$${e}: ${process.env[e]}\n`
  }
}
module.exports = {
  lintOnSave: false,
  publicPath: '',
  productionSourceMap: false,
  pwa: {
    name: process.env.VUE_APP_NAME,
    desscription: process.env.VUE_APP_DESC,
    manifestOptions: {
      icons: [
        {
          src: `img/bots/${process.env.VUE_APP_NAME.toLowerCase()}_positive.svg`,
          sizes: '192x192',
          type: 'image/svg',
          purpose: 'maskable any'
        },
        {
          src: `img/bots/${process.env.VUE_APP_NAME.toLowerCase()}_positive.svg`,
          sizes: '512x512',
          type: 'image/svg',
          purpose: 'maskable any'
        }
      ]
    },
    iconPaths: {
      favicon32: `img/bots/${process.env.VUE_APP_NAME.toLowerCase()}_positive.svg`,
      favicon16: `img/bots/${process.env.VUE_APP_NAME.toLowerCase()}_positive.svg`,
      appleTouchIcon: `img/bots/${process.env.VUE_APP_NAME.toLowerCase()}_positive.svg`,
      maskIcon: `img/bots/${process.env.VUE_APP_NAME.toLowerCase()}_positive.svg`,
      msTileImage: `img/bots/${process.env.VUE_APP_NAME.toLowerCase()}_positive.svg`
    }
  },
  css: {
    loaderOptions: {
      sass: {
        additionalData: sav
      }
    }
  }
}
