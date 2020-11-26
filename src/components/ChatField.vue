<template>
    <div class="chat-field">
        <div class="chat-field-container">
            <!-- Here are the suggestions -->
            <transition name="chat-field-suggestions-animation">
                <div v-if="query.length == 0" class="chat-field-suggestions">
                    <slot />
                </div>
            </transition>
            <VEmojiPicker
                v-show="showDialog"
                label-search="Search"
                lang="pt-BR"
                @select="onSelectEmoji"
            />
            <div class="chat-field-flexible">
                <!-- Text input -->
                <textarea
                    v-model="query"
                    class="chat-field-input"
                    type="text"
                    autofocus
                    :placeholder="
                        (translations[lang()] && translations[lang()].inputTitle) ||
                            translations[config.fallback_lang].inputTitle
                    "
                    :aria-label="
                        (translations[lang()] && translations[lang()].inputTitle) ||
                            translations[config.fallback_lang].inputTitle
                    "
                    @keydown="inputHandler"
                    @focus="
                        microphone = false;
                        should_listen = false;
                        $emit('typing');
                    "
                />

                <!-- Send message button (arrow button) -->
                <transition name="chat-field-button-animation" mode="out-in">
                    <button
                        v-if="(!microphone && query.length > 0) || !microphone_supported"
                        key="send"
                        class="chat-field-action"
                        :title="
                            (translations[lang()] && translations[lang()].sendTitle) ||
                                translations[config.fallback_lang].sendTitle
                        "
                        :aria-label="
                            (translations[lang()] && translations[lang()].sendTitle) ||
                                translations[config.fallback_lang].sendTitle
                        "
                        @click="submit({ text: query })"
                    >
                        <i class="material-icons" aria-hidden="true">arrow_upward</i>
                    </button>

                    <!-- Microphone Button -->
                    <button
                        v-else
                        key="microphone"
                        class="chat-field-action"
                        :aria-label="
                            (translations[lang()] && translations[lang()].microphoneTitle) ||
                                translations[config.fallback_lang].microphoneTitle
                        "
                        :title="
                            (translations[lang()] && translations[lang()].microphoneTitle) ||
                                translations[config.fallback_lang].microphoneTitle
                        "
                        :class="{ mic_active: microphone }"
                        @click="microphone = !microphone"
                    >
                        <i class="material-icons" aria-hidden="true">mic</i>
                    </button>
                </transition>
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
                    class="top-head-button start"
                    title="Start training"
                    aria-label="Start training"
                    @click="submit({ text: 'training' })"
                >
                    <i class="material-icons" aria-hidden="true">model_training</i>
                </button>
                <button
                    aria-label="Cancel"
                    title="Cancel"
                    class="top-head-button stop"
                    @click="submit({ text: 'cancel' })"
                >
                    <i class="material-icons" aria-hidden="true">cancel</i>
                </button>
                <button
                    class="top-head-button feedback"
                    aria-label="Feedback"
                    title="Feedback"
                    @click="submit({ text: 'feedback' })"
                >
                    <i class="material-icons" aria-hidden="true">feedback</i>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { VEmojiPicker } from 'v-emoji-picker'
import AudioRecorder from 'audio-recorder-polyfill'
import * as hark from 'hark'

window.MediaRecorder = AudioRecorder

export default {
    name: 'ChatField',
    components: {
        VEmojiPicker
    },
    data(){
        return {
            query: '',
            showDialog: false,
            microphone: false,
            recognition: null,
            recorder: null,
            should_listen: false
        }
    },
    computed: {
        microphone_supported(){
            return (
                window.webkitSpeechRecognition ||
        window.SpeechRecognition ||
        !window.MediaRecorder.notSupported
            )
        }
    },
    watch: {
    /* Toggle microphone */
        microphone(activate){
            if (activate){
                this.should_listen = true
                this.$emit('listening')

                if (window.webkitSpeechRecognition || window.SpeechRecognition){
                    this.recognition =
            new window.webkitSpeechRecognition() ||
            new window.SpeechRecognition()
                    this.recognition.interimResults = true
                    this.recognition.lang = this.lang()
                    this.recognition.onresult = event => {
                        for (let i = event.resultIndex; i < event.results.length; ++i){
                            this.query = event.results[i][0].transcript // <- push results to the Text input
                        }
                    }

                    this.recognition.onend = () => {
                        this.recognition.stop()
                        this.microphone = false
                        this.submit({ text: this.query }) // <- submit the result
                    }

                    this.recognition.onerror = () => this.microphone = false
                    this.recognition.start()
                } else if (window.MediaRecorder){
                    navigator.mediaDevices
                    .getUserMedia({ audio: true })
                    .then(stream => {
                        this.recorder = new window.MediaRecorder(stream)
                        this.recorder.addEventListener('dataavailable', recording => {
                            const reader = new FileReader()
                            reader.readAsDataURL(recording.data)
                            reader.onloadend = () => {
                                this.submit({
                                    audio: reader.result.replace(/^data:.+;base64,/, '')
                                })
                            }
                        })

                        hark(this.recorder.stream).on('stopped_speaking',
                            () => this.microphone = false) // <- Speech end detection
                        this.recorder.start()
                    })
                    .catch(() => this.microphone = false)
                }
            } else if (this.recognition) this.recognition.abort()
            else if (this.recorder) this.recorder.stop()
        }
    },
    methods: {
        inputHandler(e){
            if (e.keyCode === 13 && !e.shiftKey){
                e.preventDefault()
                this.submit({ text: this.query })
            }
        },
        toogleDialogEmoji(){
            this.showDialog = !this.showDialog
        },
        onSelectEmoji(emoji){
            this.query += emoji.data
            // Optional
            // this.toogleDialogEmoji();
        },
        listen(){
            if (this.should_listen) this.microphone = true
        },
        submit(submission){
            if (submission.text && submission.text.length > 0){
                this.$emit('submit', submission)
                this.query = ''
                this.showDialog = false
            } else if (submission.audio) this.$emit('submit', submission)
        }
    }
}
</script>
<style lang="sass" scoped>
@import '@/style/mixins'

.chat-field
    position: fixed
    bottom: 0
    left: 0
    width: 100%
    background-color: var(--background)
    z-index: 2

.chat-field-container
    max-width: var(--container-width)
    margin: auto auto
    padding: 12px

.chat-field-flexible
    display: flex
    border-radius: 40px
    border: var(--border)

.chat-field-suggestions
    overflow-x: scroll
    overflow-y: hidden
    white-space: nowrap
    -webkit-overflow-scrolling: touch

    &::-webkit-scrollbar
        display: none

.chat-field-input
    font-size: 16px
    width: 100%
    box-sizing: border-box
    border: none
    padding: 10px 0 10px 12px
    color: var(--text-primary)
    border-radius: 40px 0 0 40px
    background-color: transparent

.chat-field-action
    @include reset
    padding: 10px 12px
    cursor: pointer
    color: var(--accent)
    font-size: 24px
    display: flex

    &.mic_active
        color: #F44336

.chat-field-suggestions-animation-enter-active, .chat-field-suggestions-animation-leave-active
    transition: all .15s var(--animation-timing)

.chat-field-suggestions-animation-enter, .chat-field-suggestions-animation-leave-to
    transform: translateY(10px)
    opacity: 0

.chat-field-button-animation-enter-active, .chat-field-button-animation-leave-active
    transition: all .15s var(--animation-timing)

.chat-field-button-animation-enter, .chat-field-button-animation-leave-to
    transform: scale(0)
    opacity: 0

.top-head-button
  background-color: transparent
  border: 0
  color: black
  padding: 1px 2px
  font-size: small
  cursor: pointer

.top-head-button.start
  color: green

.top-head-button.stop
  color: red

.top-head-button.feedback
  color: blue

.top-head-button.emoji
  color: goldenrod

.top-head-button:hover
  background: #2196F3
  color: white
</style>
