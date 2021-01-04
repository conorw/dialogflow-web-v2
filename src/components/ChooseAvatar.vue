<template>
    <div class="background-container">
        <h3 style="text-align: center">Images designed by <a href="https://speckyboy.com/" target="_blank">Speckyboy.com</a></h3>
        <img v-for="background in backgrounds" :key="background" :src="background" @click="select(background)">
    </div>
</template>
<script>
export default {
    name: 'ChooseAvatar',
    props: {
        current: {
            type: String,
            required: false,
            default: ''
        }
    },
    data(){
        return {
            backgrounds: [
                '/img/avatars/SVG/flat/03-pirates.svg',
                '/img/avatars/SVG/flat/04-girl.svg',
                '/img/avatars/SVG/flat/05-boy.svg',
                '/img/avatars/SVG/flat/08-police.svg',
                '/img/avatars/SVG/flat/10-girl.svg',
                '/img/avatars/SVG/flat/13-rock.svg',
                '/img/avatars/SVG/flat/14-boy.svg',
                '/img/avatars/SVG/flat/16-girl.svg',
                '/img/avatars/SVG/flat/18-baby.svg',
                '/img/avatars/SVG/flat/20-clown.svg',
                '/img/avatars/SVG/flat/22-portuguese.svg',
                '/img/avatars/SVG/flat/24-girl.svg',
                '/img/avatars/SVG/flat/27-ninja.svg',
                '/img/avatars/SVG/flat/29-girl.svg',
                '/img/avatars/SVG/flat/30-viking.svg',
                '/img/avatars/SVG/flat/31-boy.svg',
                '/img/avatars/SVG/flat/36-user.svg',
                '/img/avatars/SVG/flat/37-dj.svg',
                '/img/avatars/SVG/flat/38-girl.svg',
                '/img/avatars/SVG/flat/39-girl.svg',
                '/img/avatars/SVG/flat/41-cowboy.svg',
                '/img/avatars/SVG/flat/43-santa clause.svg',
                '/img/avatars/SVG/flat/45-doctor.svg',
                '/img/avatars/SVG/flat/47-scientist.svg'
            ]

        }
    },
    methods: {
        select(avatar){
            localStorage.setItem('avatar', avatar)
            this.$emit('avatar', avatar)
        }
    }
}
</script>

<style scoped>

.background-container {
    height: 100%;
    overflow: auto;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: center;
}
.background-container img {
    margin: 2px;
    max-width: 30%;
    max-height: 60px;
}

</style>
