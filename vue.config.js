let sav = ''
for (const e in process.env){
    if ((/VUE_APP_STYLE/i).test(e)){
        sav += `$${e}: ${process.env[e]}\n`
        console.log(sav)
    }
}
module.exports = {
    lintOnSave: false,
    publicPath: '',
    productionSourceMap: false,
    pwa: {
        name: process.env.VUE_APP_NAME,
        desscription: process.env.VUE_APP_DESC
    },
    css: {
        loaderOptions: {
            sass: {
                additionalData: sav
            }
        }
    }
}
