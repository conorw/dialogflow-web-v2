<template>
    <main id="app">
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
        <section class="chat">
            <!-- Error component is for displaying errors -->
            <ErrorMessage v-if="error" :message="error" />

            <!-- Welcome component is for onboarding experience and language picker -->
            <!-- <WelcomeView v-if="agent && messages.length == 0" :agent="agent" /> -->
            <!-- Messages Table -->
            <section v-else aria-live="polite">
                <Message v-if="lastBotMessage" :loading="loading" :message="lastBotMessage" />
            </section>
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

import Message from '@/components/Message'

import * as uuidv1 from 'uuid/v1'

import { Client } from 'dialogflow-gateway'

export default {
    name: 'Home1',
    components: {
        ErrorMessage,
        ChatField,
        Message,
        RichSuggesion
    },
    data(){
        return {
            agent: null,
            messages: [],
            lastBotMessage: null,
            lastUserMessage: null,
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
            if (this.history()) sessionStorage.setItem('message_history', JSON.stringify(messages)) // <- Save history if the feature is enabled
        },
        /* This function is triggered, when request is started or finished */
        loading(){
            setTimeout(() => {
                const app = document.querySelector('#app') // <- We need to scroll down #app, to prevent the whole page jumping to bottom, when using in iframe
                if (app.querySelector('#message')){
                    const message =
            app.querySelectorAll('#message')[
            app.querySelectorAll('#message').length - 1
            ].offsetTop - 70
                    window.scrollTo({ top: message, behavior: 'smooth' })
                }
            }, 2) // <- wait for render (timeout) and then smoothly scroll #app down to the last message
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

            /* Send the request to endpoint */
            this.client
            .send(request)
            .then(response => {
                this.messages.push(response)
                this.lastBotMessage = response
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

.chat
    max-width: var(--container-width)
    margin: auto auto
    padding: 70px 12px 112px 12px

.bot-profile
    position: -webkit-sticky
    position: sticky
    top: 5%

.bot-profile
    width: 30vw

.bot-profile img
    width: 100%

@media only screen and (max-width: 600px)
  .bot-profile
    display: none

.bot-title
    font-size: xx-large
    font-weight: bold
    color: var(--text-title)
    line-height: 25px
    text-align: center

.confidence-score
    font-size: x-small
    color: lightgray
</style>
