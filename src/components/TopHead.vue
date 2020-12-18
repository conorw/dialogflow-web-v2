<template>
    <header class="top-head">
        <div class="top-head-container">
            <a
                href="/"
            > <button
                class="top-head-button home"
                aria-label="Home"
                title="Home"
            >
                <i class="material-icons" aria-hidden="true">home</i>
            </button></a>
            <a
                href="/#/training"
            > <button
                class="top-head-button training"
                aria-label="Training"
                title="Training"
            >
                <i class="material-icons" aria-hidden="true">model_training</i>
            </button></a>
            <a
                href="https://newaccount1607080294888.freshdesk.com/support/solutions"
                target="_blank"> <button
                    class="top-head-button help"
                    aria-label="Help"
                    title="Help"
                >
                    <i class="material-icons" aria-hidden="true">help</i>
                </button></a>
            <button
                class="top-head-button settings"
                aria-label="Settings"
                title="Settings"
                @click="openBackground"
            >
                <i class="material-icons" aria-hidden="true">app_settings_alt</i>
            </button>
            <div class="top-head-info">
                <!-- <div class="top-head-subtitle">
                    {{(translations[lang()] && translations[lang()].poweredBy) ||
                        translations[config.fallback_lang].poweredBy}}
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://dialogflow.cloud.ushakov.co"
                        aria-hidden="true"
                    >Dialogflow Gateway</a
                    >
                </div> -->
                <span style="display:none">Voice:
                    <select @change="onchange($event)">
                        <option v-for="option in voices" :key="option.voiceURI" :value="option.voiceURI">
                            {{option.name}}
                        </option>
                    </select>
                </span>
            </div>
        </div>
        <slot />
        <modal name="background" height="auto" width="80%">
            <ChooseBackground @background="background" />
        </modal>
    </header>
</template>

<script>
import ChooseBackground from '@/components/ChooseBackground'
export default {
    name: 'TopHead',
    components: {
        ChooseBackground
    },
    props: {
        agent: {
            type: Object,
            default: null
        },
        voices: {
            type: Array,
            default: null
        },
        selectedvoice: {
            type: String,
            default: ''
        }
    },
    methods: {
        openBackground(){
            this.$modal.show('background')
        },
        background(bck){
            console.log(bck)
            this.$modal.hide('background')
            this.$emit('background', bck)
        },
        onchange(event){
            this.$emit('update:selectedvoice', event.target.value)
        },
        submit(submission){
            if (submission.text && submission.text.length > 0){
                this.$emit('submit', submission)
            }
        }
    }
}
</script>
<style lang="sass" scoped>
@import '@/style/mixins'

.top-head
    position: fixed
    width: 100%
    display: flex
    z-index: 3
    top: 0
    height: 60px

.top-head-container
    padding: 12px
    display: flex
    align-items: center
    flex: 1 0 0

.top-head-button
    background: transparent
    border: none

.top-head-icon
    width: 30px
    height: 30px
    object-fit: cover

.top-head-info
    display: inline-block
    margin-left: 12px

.top-head-title
    font-size: 18px
    color: var(--text-title)
    line-height: 15px

.top-head-subtitle
    color: var(--text-secondary)
    font-size: 14px

    a[href]
        color: var(--text-primary)
        text-decoration: none

</style>

