let sav = ''
for (const e in process.env){
  if ((/VUE_APP_STYLE/i).test(e)){
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
    iconPaths: {
      favicon32: `img/bots/${process.env.VUE_APP_NAME.toLowerCase()}_positive.svg`,
      favicon16: `img/bots/${process.env.VUE_APP_NAME.toLowerCase()}_positive.svg`
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
