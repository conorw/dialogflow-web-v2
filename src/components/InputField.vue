<template>
    <div class="input-field">
        <div class="input-field-container">
            <VEmojiPicker
                v-show="showDialog"
                label-search="Search"
                lang="pt-BR"
                @select="onSelectEmoji"
            />
            <div class="input-field-flexible">
                <!-- Text input -->
                <!-- <transition name="bounce"> -->
                <textarea
                    v-model="query"
                    class="input-field-input"
                    type="text"
                />
            </div>
            <div class="training-options">
                <button
                    aria-label="Emoji"
                    class="top-head-button emoji"
                    @click="toogleDialogEmoji"
                >
                    <i class="material-icons" aria-hidden="true">emoji_emotions</i>
                </button>
                <button
                    class="top-head-button gif"
                    aria-label="GIF"
                    title="GIF"
                    @click="openGiphy"
                >
                    <i class="material-icons" aria-hidden="true">gif</i>
                </button>
                <button
                    class="top-head-button stickers"
                    aria-label="stickers"
                    title="stickers"
                    @click="openStickers"
                >
                    <img
                        src="/img/stickers.png">
                </button>
            </div>
        </div>
        <modal name="example" height="auto" width="80%">
            <giphy-search :api="getApi" @select="select" />
        </modal>
    </div>
</template>

<script>
import { VEmojiPicker } from 'v-emoji-picker'
import GiphySearch from '@/components/GiphySearch'

export default {
    name: 'InputField',
    components: {
        VEmojiPicker,
        GiphySearch
    },
    props: {
        querystr: {
            type: String,
            required: false,
            default: ''
        }
    },
    data(){
        return {
            query: '',
            showDialog: false,
            api: ''
        }
    },
    computed: {
        getApi(){
            return this.api
        }
    },
    watch:
    {
        'query':
        {
            handler()
            {
                if (this.query !== this.querystr){
                    this.$emit('update:querystr', this.query)
                }
            },
            deep: false
        }
    },
    mounted(){
        this.query = this.querystr
    },
    methods: {
        openGiphy(){
            this.api = 'gifs'
            this.$modal.show('example')
        },
        openStickers(){
            this.api = 'stickers'
            this.$modal.show('example')
        },
        select(gif){
            this.$modal.hide('example')
            this.query = gif
        },
        toogleDialogEmoji(){
            this.showDialog = !this.showDialog
        },
        onSelectEmoji(emoji){
            this.query += emoji.data
            // Optional
            this.toogleDialogEmoji()
        }
    }
}
</script>
<style lang="sass" scoped>
@import '@/style/mixins'


.input-field
    width: 80%
    background-color: var(--background)
    z-index: 2

.input-field-container
    width: 100%
    display: flex

.input-field-flexible
    width: 60%
    display: flex

.input-field-input
    font-size: 14px
    width: 100%
    height: 50px
    box-sizing: border-box
    border: none
    padding: 10px 0 10px 12px
    color: var(--text-primary)
    background-color: whitesmoke


.top-head-button
  background-color: transparent
  border: 0
  color: black
  width: 30px
  margin: 2px 2px
  padding: 1px 2px
  font-size: small
  cursor: pointer

.top-head-button.start
  color: green

.top-head-button.stop
  color: red

.top-head-button.topics
  color: orange

.top-head-button.feedback
  color: blue

.top-head-button.stickers img
  width: 100%

.top-head-button.emoji
  color: darkgrey

.top-head-button:hover
  background: #2196F3
  color: white

</style>
