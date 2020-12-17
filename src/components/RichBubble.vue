<template>
    <transition name="bounce" mode="out-in">
        <img
            v-if="isURL(text)"
            :key="text"
            class="rich-bubble img"
            :src="text"
            tabindex="0"
            :class="{'me': me, 'loading': loading}">

        <div
            v-else
            :key="text"
            v-resize-text="{ratio:0.8, minFontSize: '18px', delay: 200}"
            class="rich-bubble bubble-text"
            tabindex="0"
            :class="{'me': me, 'loading': loading}">
            {{text || '....'}}
        </div>
    </transition>
</template>

<script lang="ts">
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
        isURL(str: string){
            if (!str.startsWith('http')){
                return false
            }
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


.bounce-enter-active
  animation: bounce-in .5s

.bounce-leave-active
  animation: bounce-in .5s reverse

@keyframes bounce-in
  0%
    transform: scale(0)
  50%
    transform: scale(1.5)
  100%
    transform: scale(1)

.img
    max-width: 70%

.rich-bubble
    padding: 12px
    border-radius: 40px
    color: var(--text-element)
    border: 1px solid var(--background-element)
    background-color: var(--background)
    min-width: 26px
    display: flex
    align-items: center
    justify-content: center
    overflow-y: auto
    overflow-x: hidden
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