<template>
    <main id="app">
        <section class="bot-profile" aria-live="polite">
            <img
                v-if="agent.avatarUri"
                class="top-head-icon"
                :alt="agent.displayName"
                :src="agent.avatarUri"
            >
            <img
                v-else
                class="top-head-icon"
                src="/img/icon.png"
                :alt="agent.displayName"
            >
            <div class="bot-title"><span>{{agent.displayName}}</span></div>
        </section>
        <!-- TopHead is the header with the information about the app -->
        <!-- <TopHead
            v-if="agent"
            :agent="agent"
            :voices="voices"
            :selectedvoice.sync="config.voice"
            @submit="send"
        >
            <TopHeadAction
                :title="
                    muted
                        ? (translations[lang()] && translations[lang()].unMuteTitle) ||
                            translations[config.fallback_lang].unMuteTitle
                        : (translations[lang()] && translations[lang()].muteTitle) ||
                            translations[config.fallback_lang].muteTitle
                "
                :icon="muted ? 'volume_off' : 'volume_up'"
                @click.native="muted = !muted"
            />
        </TopHead> -->
        <!-- <section class="bot-profile" aria-live="polite">
            <img
                v-if="agent.avatarUri"
                class="top-head-icon"
                :alt="agent.displayName"
                :src="agent.avatarUri"
            >
            <img
                v-else
                class="top-head-icon"
                src="/img/icon.png"
                :alt="agent.displayName"
            >
            <div class="bot-title">{{agent.displayName}}</div>
        </section> -->
        <BotMessage
            v-if="lastMessage"
            class="bot-chat"
            :loading="loading"
            :message="lastMessage" />

        <MyMessage v-if="lastMessage" class="me-chat" :message="lastMessage" />
        <section class="my-profile" aria-live="polite">
            <img
                class="top-head-icon"
                src="/img/avatars/SVG/1 de 3 Avatars FLAT/27-ninja.svg"
                alt="My-Avatar"
            >
            <div class="bot-title"><span>Me</span></div>
        </section>
        <!-- ChatField is made for submitting queries and displaying suggestions -->
        <ChatField
            ref="input"
            :training="false"
            @submit="send"
            @listening="stop_feedback"
            @typing="stop_feedback"
        >
            <!-- RichSuggesion chips
                https://developers.google.com/actions/assistant/responses#suggestion_chips
                https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#QuickReplies
                https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#Suggestions
            -->
            <RichSuggesion
                v-for="(suggestion, suggestion_id) in suggestions.text_suggestions"
                :key="'text-' + suggestion_id"
                :title="suggestion"
                @click.native="send({ text: suggestion })"
            />

            <!-- Link suggestion chips
                https://developers.google.com/actions/assistant/responses#suggestion_chips
                https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#LinkOutSuggestion
                https://cloud.google.com/dialogflow/docs/integrations/dialogflow-messenger#suggestion_chip_response_type
            -->
            <RichSuggesion
                v-for="(suggestion, suggestion_id) in suggestions.link_suggestions"
                :key="'link-' + suggestion_id"
                :title="suggestion.destinationName || suggestion.text"
                :uri="suggestion.uri || suggestion.url || suggestion.link"
            />
        </ChatField>
    </main>
</template>

<script>
// import WelcomeView from '@/views/WelcomeView.vue'

import ErrorMessage from '@/components/ErrorMessage.vue'
// import TopHead from '@/components/TopHead.vue'
// import TopHeadAction from '@/components/TopHeadAction.vue'
import ChatField from '@/components/ChatField.vue'

import RichSuggesion from '@/components/RichSuggestion.vue'

import BotMessage from '@/components/BotMessage'
import MyMessage from '@/components/MyMessage'

import * as uuidv1 from 'uuid/v1'

import { Client } from 'dialogflow-gateway'

export default {
    name: 'Home1',
    components: {
        ErrorMessage,
        ChatField,
        MyMessage,
        BotMessage,
        RichSuggesion
    },
    data(){
        return {
            agent: null,
            messages: [],
            lastMessage: null,
            language: '',
            session: '',
            muted: true,
            loading: false,
            error: null,
            voices: [],
            client: new Client(this.config.endpoint),
            audio: new Audio()
        }
    },
    computed: {
    /* The code below is used to extract suggestions from last message, to display it on ChatInput */
        suggestions(){
            if (this.messages.length > 0){
                const last_message = this.messages[this.messages.length - 1]
                const text_suggestions = []
                const link_suggestions = []

                /* Dialogflow Suggestions */
                for (const component in last_message.queryResult.fulfillmentMessages){
                    if (
                        last_message.queryResult.fulfillmentMessages[component].suggestions
                    ){ text_suggestions.push(...last_message.queryResult.fulfillmentMessages[
                    component
                    ].suggestions.suggestions.map(suggestion => suggestion.title)) }
                    if (
                        last_message.queryResult.fulfillmentMessages[component]
                        .linkOutSuggestion
                    ){ link_suggestions.push(last_message.queryResult.fulfillmentMessages[component]
                    .linkOutSuggestion) }
                    if (
                        last_message.queryResult.fulfillmentMessages[component].quickReplies
                    ){ text_suggestions.push(...last_message.queryResult.fulfillmentMessages[component]
                    .quickReplies.quickReplies) }
                    if (
                        last_message.queryResult.fulfillmentMessages[component].payload &&
            last_message.queryResult.fulfillmentMessages[component].payload
            .richContent
                    ){
                        last_message.queryResult.fulfillmentMessages[
                        component
                        ].payload.richContent.forEach(stack => {
                            const chips = stack.find(item => item.type == 'chips')
                            if (chips) link_suggestions.push(...chips.options)
                        })
                    }
                }

                /* Google Suggestions */
                if (
                    last_message.queryResult.webhookPayload &&
          last_message.queryResult.webhookPayload.google
                ){
                    for (const component in last_message.queryResult.webhookPayload
                    .google){
                        if (
                            last_message.queryResult.webhookPayload.google[component]
                            .suggestions
                        ){ text_suggestions.push(...last_message.queryResult.webhookPayload.google[
                        component
                        ].suggestions.map(suggestion => suggestion.title)) }
                        if (
                            last_message.queryResult.webhookPayload.google[component]
                            .linkOutSuggestion
                        ){ link_suggestions.push(last_message.queryResult.webhookPayload.google[component]
                        .linkOutSuggestion) }
                    }
                }

                return { text_suggestions, link_suggestions }
            }

            return {
                text_suggestions: this.config.start_suggestions // <- if no messages are present, return start_suggestions, from config.js to help user figure out what he can do with your application
            }
        }
    },
    watch: {
    /* This function is triggered, when new messages arrive */
        messages(messages){
            this.lastMessage = messages.length ? messages[messages.length - 1] : null
            if (this.history()) sessionStorage.setItem('message_history', JSON.stringify(messages)) // <- Save history if the feature is enabled
        },
        /* If muted, stop playing feedback */
        muted(muted){
            this.audio.muted = muted
            if (muted) this.stop_feedback()
        }
    },
    created(){
    /* Mute audio to comply with auto-play policies */
        this.audio.muted = true
        this.voices = speechSynthesis.getVoices()
        this.config.voice = this.voices.length
            ? this.voices[0].voiceURI
            : this.config.voice
        speechSynthesis.onvoiceschanged = () => {
            this.voices = speechSynthesis.getVoices()
            this.config.voice = this.voices.length
                ? this.voices[0].voiceURI
                : this.config.voice
            console.log(`Voices #: ${this.voices.length}`, this.voices)
        }
        /* If history is enabled, the messages are retrieved from sessionStorage */
        if (this.history() && sessionStorage.getItem('message_history') !== null){
            this.messages = JSON.parse(sessionStorage.getItem('message_history'))
        }

        /* Session should be persistent (in case of page reload, the context should stay) */
        if (this.history() && sessionStorage.getItem('session') !== null){
            this.session = sessionStorage.getItem('session')
        } else {
            this.session = uuidv1()
            if (this.history()) sessionStorage.setItem('session', this.session)
        }

        /* Cache Agent (this will save bandwith) */
        if (this.history() && sessionStorage.getItem('agent') !== null){
            this.agent = JSON.parse(sessionStorage.getItem('agent'))
        } else {
            this.client
            .get()
            .then(agent => {
                this.agent = agent
                if (this.history()) sessionStorage.setItem('agent', JSON.stringify(agent))
            })
            .catch(error => {
                this.error = error.message
            })
        }
    },
    methods: {
        voiceChanged(data){
            this.config.voice = data
        },
        send(submission){
            let request
            /* Text request */
            if (submission.text){
                request = {
                    session: this.session,
                    queryInput: {
                        text: {
                            text: submission.text,
                            languageCode: this.lang()
                        }
                    }
                }
            } else if (submission.audio){
                /* Audio request */
                request = {
                    session: this.session,
                    queryInput: {
                        audioConfig: {
                            audioEncoding: 'AUDIO_ENCODING_UNSPECIFIED',
                            languageCode: this.lang()
                        }
                    },
                    inputAudio: submission.audio
                }
            }

            this.stop_feedback()
            this.loading = true
            this.error = null
            if (submission.text){
                this.lastMessage = {queryResult: {queryText: submission.text}}
            }
            /* Send the request to endpoint */
            this.client
            .send(request)
            .then(response => {
                this.messages.push(response)
                this.handle(response) // <- trigger the handle function (explanation below)
                if (this.debug()) console.log(response) // <- log responses in development mode
            })
            .catch(error => {
                this.error = error.message
            })
            .then(() => this.loading = false)
        },
        handle(response){
            /* Speech output */
            if (response.outputAudio.data.length){
                /* Detect MIME type (or fallback to default) */
                const mime =
          this.config.codecs[response.outputAudioConfig.audioEncoding] ||
          this.config.codecs.OUTPUT_AUDIO_ENCODING_UNSPECIFIED
                this.audio.src = `data:${mime};base64,${response.outputAudio}`
                this.audio.onended = () => this.$refs.input.listen()

                if (!this.muted) this.audio.play()
            } else {
                let text = '' // <- init a text variable

                /* Dialogflow Text/SimpleResponses */
                for (const component in response.queryResult.fulfillmentMessages){
                    if (response.queryResult.fulfillmentMessages[component].text) text += `${response.queryResult.fulfillmentMessages[component].text.text[0]}. `
                    if (
                        response.queryResult.fulfillmentMessages[component]
                        .simpleResponses &&
            response.queryResult.fulfillmentMessages[component].simpleResponses
            .simpleResponses[0].textToSpeech
                    ) text += `${response.queryResult.fulfillmentMessages[component].simpleResponses.simpleResponses[0].textToSpeech}. `
                    if (response.queryResult.fulfillmentMessages[component].rbmText) text += `${response.queryResult.fulfillmentMessages[component].rbmText.text}. `
                }

                /* Actions on Google Simple response */
                if (
                    response.queryResult.webhookPayload &&
          response.queryResult.webhookPayload.google
                ){
                    for (const component in response.queryResult.webhookPayload.google
                    .richResponse.items){
                        if (
                            response.queryResult.webhookPayload.google.richResponse.items[
                            component
                            ].simpleResponse &&
              response.queryResult.webhookPayload.google.richResponse.items[
              component
              ].simpleResponse.textToSpeech
                        ) text += `${response.queryResult.webhookPayload.google.richResponse.items[component].simpleResponse.textToSpeech}. `
                    }
                }

                const speech = new SpeechSynthesisUtterance(text)
                speech.voiceURI = this.config.voice
                console.log(speech.voiceURI)
                speech.lang = this.lang()
                speech.onend = () => this.$refs.input.listen()

                if (!this.muted) window.speechSynthesis.speak(speech) // <- if app is not muted, speak out the speech
            }
        },
        /* Stop audio speech/playback */
        stop_feedback(){
            if (window.speechSynthesis) window.speechSynthesis.cancel()
            if (this.audio && !this.audio.paused) this.audio.pause()
        }
    }
}
</script>

<style lang="sass">
@import '@/style/theme.sass'

body
    margin: 0
    padding: 0
    font-family: var(--font)
    font-display: swap
    background-color: var(--background)
    background-color: #ffffff
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 800'%3E%3Cdefs%3E%3CradialGradient id='a' cx='400' cy='400' r='50%25' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23ffffff'/%3E%3Cstop offset='1' stop-color='%230EF'/%3E%3C/radialGradient%3E%3CradialGradient id='b' cx='400' cy='400' r='70%25' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23ffffff'/%3E%3Cstop offset='1' stop-color='%230FF'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect fill='url(%23a)' width='800' height='800'/%3E%3Cg fill-opacity='.8'%3E%3Cpath fill='url(%23b)' d='M998.7 439.2c1.7-26.5 1.7-52.7 0.1-78.5L401 399.9c0 0 0-0.1 0-0.1l587.6-116.9c-5.1-25.9-11.9-51.2-20.3-75.8L400.9 399.7c0 0 0-0.1 0-0.1l537.3-265c-11.6-23.5-24.8-46.2-39.3-67.9L400.8 399.5c0 0 0-0.1-0.1-0.1l450.4-395c-17.3-19.7-35.8-38.2-55.5-55.5l-395 450.4c0 0-0.1 0-0.1-0.1L733.4-99c-21.7-14.5-44.4-27.6-68-39.3l-265 537.4c0 0-0.1 0-0.1 0l192.6-567.4c-24.6-8.3-49.9-15.1-75.8-20.2L400.2 399c0 0-0.1 0-0.1 0l39.2-597.7c-26.5-1.7-52.7-1.7-78.5-0.1L399.9 399c0 0-0.1 0-0.1 0L282.9-188.6c-25.9 5.1-51.2 11.9-75.8 20.3l192.6 567.4c0 0-0.1 0-0.1 0l-265-537.3c-23.5 11.6-46.2 24.8-67.9 39.3l332.8 498.1c0 0-0.1 0-0.1 0.1L4.4-51.1C-15.3-33.9-33.8-15.3-51.1 4.4l450.4 395c0 0 0 0.1-0.1 0.1L-99 66.6c-14.5 21.7-27.6 44.4-39.3 68l537.4 265c0 0 0 0.1 0 0.1l-567.4-192.6c-8.3 24.6-15.1 49.9-20.2 75.8L399 399.8c0 0 0 0.1 0 0.1l-597.7-39.2c-1.7 26.5-1.7 52.7-0.1 78.5L399 400.1c0 0 0 0.1 0 0.1l-587.6 116.9c5.1 25.9 11.9 51.2 20.3 75.8l567.4-192.6c0 0 0 0.1 0 0.1l-537.3 265c11.6 23.5 24.8 46.2 39.3 67.9l498.1-332.8c0 0 0 0.1 0.1 0.1l-450.4 395c17.3 19.7 35.8 38.2 55.5 55.5l395-450.4c0 0 0.1 0 0.1 0.1L66.6 899c21.7 14.5 44.4 27.6 68 39.3l265-537.4c0 0 0.1 0 0.1 0L207.1 968.3c24.6 8.3 49.9 15.1 75.8 20.2L399.8 401c0 0 0.1 0 0.1 0l-39.2 597.7c26.5 1.7 52.7 1.7 78.5 0.1L400.1 401c0 0 0.1 0 0.1 0l116.9 587.6c25.9-5.1 51.2-11.9 75.8-20.3L400.3 400.9c0 0 0.1 0 0.1 0l265 537.3c23.5-11.6 46.2-24.8 67.9-39.3L400.5 400.8c0 0 0.1 0 0.1-0.1l395 450.4c19.7-17.3 38.2-35.8 55.5-55.5l-450.4-395c0 0 0-0.1 0.1-0.1L899 733.4c14.5-21.7 27.6-44.4 39.3-68l-537.4-265c0 0 0-0.1 0-0.1l567.4 192.6c8.3-24.6 15.1-49.9 20.2-75.8L401 400.2c0 0 0-0.1 0-0.1L998.7 439.2z'/%3E%3C/g%3E%3C/svg%3E")
    background-attachment: fixed
    background-size: cover

.chat
    max-width: var(--container-width)
    margin: auto auto
    padding: 70px 12px 112px 12px

.chat-field
    background-color: transparent !important

.rich-card-content
    padding: 6px
.rich-card-title
    font-size: medium !important
    line-height: 1em !important
.rich-card-text
    font-size: small !important
    max-height: 40vh
    overflow: auto

.bot-chat
    width: 60% !important
    height: 20% !important
    top: 20%
    position: absolute
    right: 10px
    z-index: 2
.bot-chat .rich-component
    text-align: center
    height: 100%
    width: 100%

.bot-chat .rich-bubble
    width: 80% !important
    text-align: center
    height: 100% !important
    background: white


.me-chat
    width: 55% !important
    height: 20% !important
    bottom: 22%
    left: 5px
    position: absolute
.me-chat .rich-bubble
    width: 80%
    text-align: center
    vertical-align: center
    height: 100%

.bot-profile
    position: -webkit-sticky
    position: sticky
    top: 5%
    display: inline
    position: absolute
    width: 45%

.bot-profile img
    width: 100%

.bot-title
    text-align: center
    margin-top: -10px

.bot-title span
    font-size: x-large
    border: aqua
    background: white
    width: min-content
    text-align: center
    border-radius: 10px
    left: auto
    border-width: thick
    border-style: dotted

.rich-bubble.me
    border-top-right-radius: 40px !important
    border-bottom-right-radius: 0 !important
    background-color: white !important


.rich-bubble::after
    content: "" !important
.rich-bubble::before
    content: "" !important

.my-profile
    position: -webkit-sticky
    position: sticky
    bottom: 18vh
    display: inline
    position: absolute
    width: 40%
    right: 5px

.my-profile img
    width: 100%

@media screen and (min-width: 720px)
    .bot-profile
        width: 55%
        right: 45%
        max-width: 40vh
    .bot-profile img
        width: 100%
    .bot-chat
        width: 45% !important
    .bot-chat .rich-component
        width: 100%
</style>
