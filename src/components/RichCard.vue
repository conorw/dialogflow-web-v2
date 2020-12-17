<template>
    <div class="rich-card" tabindex="0">
        <img v-if="imageUri" class="rich-card-image" :src="imageUri" :alt="imageTitle || title">
        <div class="rich-card-content">
            <div v-if="title" class="rich-card-title">{{title}}</div>
            <hr>
            <div v-if="subtitle" class="rich-card-subtitle">{{subtitle}}</div>
            <div v-if="text" class="rich-card-text">{{text}}</div>
            <div :class="{'rich-card-actions': $slots.default}"><slot /></div>
        </div>
    </div>
</template>
<script>
export default {
    name: 'RichCard',
    props: {
        text: {
            type: String,
            default: null
        },
        imageUri: {
            type: String,
            default: null
        },
        imageTitle: {
            type: String,
            default: null
        },
        subtitle: {
            type: String,
            default: null
        },
        title: {
            type: String,
            default: null
        }
    }
}
</script>

<style lang="sass" scoped>
.rich-card
    background-color: var(--background-component)
    box-shadow: var(--shadow)
    border-radius: 12px

.rich-card-image
    width: 100%
    height: auto
    object-fit: cover
    border-top-right-radius: 10px
    border-top-left-radius: 10px
    background-color: var(--background-image)

.rich-card-content
    padding: 16px

.rich-card-title
    font-size: 20px
    font-weight: bold
    color: var(--text-title)
    line-height: 24px
    overflow: hidden
    text-overflow: ellipsis

.rich-card-subtitle
    font-size: 10px
    line-height: 20px
    float: right
    position: fixed
    top: -10px
    right: -10px
    padding: 3px
    background: chartreuse
    border-radius: 5px
    border-style: solid
    border-width: 1px


.rich-card-text
    line-height: 20px
    font-size: medium
    color: var(--text-title)
    white-space: normal

.rich-card-actions
    padding-top: 16px

</style>

