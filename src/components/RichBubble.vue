<template>
    <img
        v-if="isURL(text)"
        class="rich-bubble img"
        :src="text"
        tabindex="0"
        :class="{'me': me, 'loading': loading}">
    <div v-else class="rich-bubble" tabindex="0" :class="{'me': me, 'loading': loading}">{{text}}</div>
</template>

<script>
export default {
    name: 'RichBubble',
    props: {
        text: {
            type: String,
            required: false,
            default: ''
        },
        me: {
            type: Boolean
        },
        loading: {
            type: Boolean
        }
    },
    methods: {
        isURL(str){
            const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
            return pattern.test(str)
        }
    }
}
</script>
<style lang="sass" scoped>

.img
    max-height: 50%

.rich-bubble
    padding: 12px
    border-radius: 40px
    color: var(--text-element)
    border: 1px solid var(--background-element)
    display: inline-block
    position: relative
    background-color: var(--background)
    min-width: 26px
    border-top-left-radius: 0
    word-wrap: break-word
    flex-grow: 0
    white-space: pre-wrap
    &::before
        content: var(--bubble-left)
        position: absolute
        left: 0
        top: 0
        margin-top: -9px
        margin-left: -1px

    &.me
        background-color: var(--background-element)
        border: 1px solid var(--background-element)
        color: var(--text-element)
        border-top-left-radius: 40px
        border-top-right-radius: 0
        &::before
            content: ''

        &::after
            content: var(--bubble-right)
            position: absolute
            right: 0
            top: 0
            margin-top: -9px
            margin-right: -1px

    &.loading
        height: 16px
        animation: loading .8s var(--animation-timing) infinite

@keyframes loading
    0%
        opacity: 0
    50%
        opacity: 1
    100%
        opacity: 0

</style>