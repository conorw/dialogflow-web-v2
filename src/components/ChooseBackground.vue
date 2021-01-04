<template>
    <div>
        <div class="background-container">
            <img v-for="background in backgrounds" :key="background" :src="background" @click="select(background)">
        </div>
    </div>
</template>
<script>
export default {
    name: 'ChooseBackground',
    props: {
        current: {
            type: String,
            required: false,
            default: ''
        }
    },
    data(){
        return {
            backgrounds: ['/img/backgrounds/Wintery-Sunburst.svg',
                '/img/backgrounds/Alternating-Arrowhead.svg',
                '/img/backgrounds/Bermuda-Traingle.svg',
                '/img/backgrounds/Colorful-Stingrays.svg',
                '/img/backgrounds/Dalmatian-Spots.svg',
                '/img/backgrounds/Geometric-Intersection.svg',
                '/img/backgrounds/Liquid-Cheese.svg',
                '/img/backgrounds/Page-Turner.svg']

        }
    },
    methods: {
        select(background){
            localStorage.setItem('background', background)
            this.$emit('background', background)
        }
    }
}
</script>

<style scoped>

.background-container {
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: center;
}
.background-container img {
    margin: 2px;
    max-width: 30%;
    max-height: 200px;
}

</style>
