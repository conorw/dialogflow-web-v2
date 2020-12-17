<template>
    <div id="message">
        <!-- Dialogflow Components -->
        <RichComponent
            v-for="(component, component_id) in message.queryResult
                .fulfillmentMessages"
            :key="component_id"
            :style="{'display':showMsg(component)?'inherit':'none'}"
            :fullwidth="
                component.carouselSelect !== undefined ||
                    component.rbmCarouselRichCard !== undefined ||
                    (component.payload && component.payload.richContent !== undefined)
            "
        >
            <!-- Text (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#Text) -->
            <RichBubble
                v-if="
                    component.text &&
                        !message.queryResult.fulfillmentMessages.find(
                            (t) => t.message === 'simpleResponses'
                        )
                "
                :text="
                    component.text.text[0] ||
                        (translations[lang()] && translations[lang()].noContent) ||
                        translations[config.fallback_lang].noContent
                "
            />

            <!-- SimpleResponses (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#SimpleResponses) -->
            <RichBubble
                v-if="component.simpleResponses"
                :text="
                    component.simpleResponses.simpleResponses[0].displayText ||
                        component.simpleResponses.simpleResponses[0].textToSpeech ||
                        (translations[lang()] && translations[lang()].noContent) ||
                        translations[config.fallback_lang].noContent
                "
            />

            <!-- RbmText (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#rbmtext) -->
            <div v-if="component.rbmText">
                <RichBubble
                    :text="
                        component.rbmText.text ||
                            (translations[lang()] && translations[lang()].noContent) ||
                            translations[config.fallback_lang].noContent
                    "
                />
                <div
                    v-for="(suggestion, suggestion_id) in component.rbmText.rbmSuggestion"
                    :key="suggestion_id"
                >
                    <RichCardButton
                        v-if="suggestion.reply"
                        :title="suggestion.reply.text"
                        @click.native="send({ text: suggestion.reply.text.postbackData })"
                    />

                    <RichCardButton
                        v-if="suggestion.action"
                        :title="suggestion.action.text"
                        :uri="suggestion.action.openUrl.uri"
                    />
                </div>
            </div>

            <!-- RichCard (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#RichCard) -->
            <RichCard
                v-if="component.card"
                :title="component.card.title"
                :subtitle="component.card.subtitle"
                :image-uri="component.card.imageUri"
            >
                <RichCardButton
                    v-for="(button, button_id) in component.card.buttons"
                    :key="button_id"
                    :uri="button.postback"
                    :title="button.text"
                />
            </RichCard>

            <!-- BasicCard (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#BasicCard) -->
            <RichCard
                v-if="component.basicCard"
                :title="component.basicCard.title"
                :subtitle="component.basicCard.subtitle"
                :image-uri="component.basicCard.image.imageUri"
                :image-title="component.basicCard.image.accessibilityText"
                :text="component.basicCard.formattedText"
            >
                <RichCardButton
                    v-for="(button, button_id) in component.basicCard.buttons"
                    :key="button_id"
                    :uri="button.openUriAction.uri"
                    :title="button.title"
                />
            </RichCard>

            <!-- RbmStandaloneCard (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#rbmstandalonecard) -->
            <RichCard
                v-if="component.rbmStandaloneRichCard"
                :title="component.rbmStandaloneRichCard.cardContent.title"
                :image-uri="component.rbmStandaloneRichCard.cardContent.media.fileUri"
                :text="component.rbmStandaloneRichCard.cardContent.description"
            >
                <div
                    v-for="(suggestion, suggestion_id) in component.rbmStandaloneRichCard
                        .cardContent.suggestions"
                    :key="suggestion_id"
                >
                    <RichCardButton
                        v-if="suggestion.reply"
                        :title="suggestion.reply.text"
                        @click.native="send({ text: suggestion.reply.text.postbackData })"
                    />
                    <RichCardButton
                        v-if="suggestion.action"
                        :title="suggestion.action.text"
                        :uri="suggestion.action.openUrl.uri"
                    />
                </div>
            </RichCard>

            <!-- CarouselSelect (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#CarouselSelect) -->
            <RichCarousel v-if="component.carouselSelect">
                <RichCard
                    v-for="item in component.carouselSelect.items"
                    :key="item.info.key"
                    :title="item.title"
                    :image-uri="item.image.imageUri"
                    :image-title="item.image.accessibilityText"
                    :text="item.description"
                    @click.native="send({ text: item.info.key })"
                />
            </RichCarousel>

            <!-- RbmCarouselCard (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#rbmcarouselcard) -->
            <RichCarousel v-if="component.rbmCarouselRichCard">
                <RichCard
                    v-for="(card, card_id) in component.rbmCarouselRichCard.cardContents"
                    :key="card_id"
                    :title="card.title"
                    :image-uri="card.media.fileUri"
                    :text="card.description"
                >
                    <div
                        v-for="(suggestion, suggestion_id) in card.suggestions"
                        :key="suggestion_id"
                    >
                        <RichCardButton
                            v-if="suggestion.reply"
                            :title="suggestion.reply.text"
                            @click.native="send({ text: suggestion.reply.text.postbackData })"
                        />
                        <RichCardButton
                            v-if="suggestion.action"
                            :title="suggestion.action.text"
                            :uri="suggestion.action.openUrl.uri"
                        />
                    </div>
                </RichCard>
            </RichCarousel>

            <!-- ListSelect (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#ListSelect) -->
            <RichList
                v-if="component.listSelect"
                :title="component.listSelect.title"
                :subtitle="component.listSelect.subtitle"
            >
                <RichListItem
                    v-for="item in component.listSelect.items"
                    :key="item.info.key"
                    :title="item.title"
                    :description="item.description"
                    :image-uri="item.image.imageUri"
                    :image-title="item.image.accessibilityText"
                    @click.native="send({ text: item.info.key })"
                />
            </RichList>

            <!-- Image (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#Image) -->
            <RichPicture
                v-if="component.image"
                :uri="component.image.imageUri"
                :title="component.image.accessibilityText"
            />

            <!-- RichMedia (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#MediaContent) -->
            <div v-if="component.mediaContent && component.mediaContent.mediaObjects">
                <RichMedia
                    v-for="(media, media_id) in component.mediaContent.mediaObjects"
                    :key="media_id"
                    :name="media.name"
                    :description="media.description"
                    :icon-uri="
                        media.icon ? media.icon.imageUri : media.largeImage.imageUri
                    "
                    :icon-title="
                        media.icon
                            ? media.icon.accessibilityText
                            : media.largeImage.accessibilityText
                    "
                    :uri="media.contentUrl"
                />
            </div>

            <!-- RichTableCard (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#tablecard) -->
            <RichTableCard
                v-if="component.tableCard"
                :title="component.tableCard.title"
                :subtitle="component.tableCard.subtitle"
                :image-uri="component.tableCard.image.imageUri"
                :image-title="component.tableCard.image.accessibilityText"
                :header="component.tableCard.columnProperties"
                :rows="component.tableCard.rows"
            >
                <RichCardButton
                    v-for="(button, button_id) in component.tableCard.buttons"
                    :key="button_id"
                    :uri="button.openUriAction.uri"
                    :title="button.title"
                />
            </RichTableCard>

            <!-- Dialogflow Messenger Components -->
            <section v-if="component.payload && component.payload.richContent">
                <div
                    v-for="(stack, stack_id) in component.payload.richContent"
                    :key="stack_id"
                >
                    <RichComponent v-for="(item, item_id) in stack" :key="item_id">
                        <!-- Info response type (https://cloud.google.com/dialogflow/docs/integrations/dialogflow-messenger#info_response_type) -->
                        <RichCard
                            v-if="item.type == 'info'"
                            :title="item.title"
                            :subtitle="item.subtitle"
                            :image-uri="item.image.src.rawUrl"
                        >
                            <RichCardButton :uri="item.actionLink" />
                        </RichCard>

                        <!-- Description response type (https://cloud.google.com/dialogflow/docs/integrations/dialogflow-messenger#description_response_type) -->
                        <RichCard
                            v-if="item.type == 'description'"
                            :title="item.title"
                            :text="item.text.join(' ')"
                        />

                        <!-- Image response type (https://cloud.google.com/dialogflow/docs/integrations/dialogflow-messenger#image_response_type) -->
                        <RichPicture
                            v-if="item.type == 'image'"
                            :uri="item.rawUrl"
                            :title="item.accessibilityText"
                        />

                        <!-- Button response type (https://cloud.google.com/dialogflow/docs/integrations/dialogflow-messenger#button_response_type) -->
                        <RichCardButton
                            v-if="item.type == 'button'"
                            :uri="item.link"
                            :title="item.text"
                        />

                        <!-- List response type (https://cloud.google.com/dialogflow/docs/integrations/dialogflow-messenger#list_response_type) -->
                        <RichListItem
                            v-if="item.type == 'list'"
                            :title="item.title"
                            :description="item.subtitle"
                            @click.native="send({ text: item.title })"
                        />

                        <!-- Accordion response type (https://cloud.google.com/dialogflow/docs/integrations/dialogflow-messenger#accordion_response_type) -->
                        <RichCard
                            v-if="item.type == 'accordion'"
                            :title="item.title"
                            :subtitle="item.subtitle"
                            :image-uri="item.image.src.rawUrl"
                            :text="item.text"
                        />
                    </RichComponent>
                </div>
            </section>
        </RichComponent>
        <div v-if="loading" id="loading-message">
            <RichComponent
            >
                <RichBubble
                    aria-hidden="true"
                    loading
                />
            </RichComponent>
        </div>
        <div v-if="training" class="confidence-score">
            Intent Confidence:
            {{message.queryResult.intent.isFallback
                ? 0
                : Math.round(message.queryResult.intentDetectionConfidence * 100)}}%
        </div>
        <!-- Actions on Google Components -->
        <section
            v-if="
                message.queryResult.webhookPayload &&
                    message.queryResult.webhookPayload.google
            "
        >
            <RichComponent
                v-for="(component, component_id) in message.queryResult.webhookPayload
                    .google.richResponse.items"
                :key="component_id"
            >
                <!-- Simple response (https://developers.google.com/actions/assistant/responses#simple_response) -->
                <RichBubble
                    v-if="component.simpleResponse"
                    :text="
                        component.simpleResponse.displayText ||
                            component.simpleResponse.textToSpeech ||
                            (translations[lang()] && translations[lang()].noContent) ||
                            translations[config.fallback_lang].noContent
                    "
                />

                <!-- Basic card (https://developers.google.com/actions/assistant/responses#basic_card) -->
                <RichCard
                    v-if="component.basicCard"
                    :title="component.basicCard.title"
                    :subtitle="component.basicCard.subtitle"
                    :image-uri="component.basicCard.image.url"
                    :image-title="component.basicCard.image.accessibilityText"
                    :text="component.basicCard.formattedText"
                >
                    <RichCardButton
                        v-for="(button, button_id) in component.basicCard.buttons"
                        :key="button_id"
                        :uri="button.openUrlAction.url"
                        :title="button.title"
                    />
                </RichCard>

                <!-- Browsing RichCarousel (https://developers.google.com/actions/assistant/responses#browsing_carousel) -->
                <RichList v-if="component.carouselBrowse">
                    <RichListItem
                        v-for="(item, item_id) in component.carouselBrowse.items"
                        :key="item_id"
                        :uri="item.openUrlAction.url"
                        :title="item.title"
                        :description="item.description"
                        :footer="item.footer"
                        :image-uri="item.image.url"
                        :image-title="item.image.accessibilityText"
                    />
                </RichList>

                <!-- RichMedia responses (https://developers.google.com/actions/assistant/responses#media_responses) -->
                <div
                    v-if="component.mediaResponse && component.mediaResponse.mediaObjects"
                >
                    <RichMedia
                        v-for="(media, media_id) in component.mediaResponse.mediaObjects"
                        :key="media_id"
                        :name="media.name"
                        :description="media.description"
                        :icon-uri="media.icon.url"
                        :icon-title="media.icon.accessibilityText"
                        :uri="media.contentUrl"
                    />
                </div>

                <!-- Table cards (https://developers.google.com/actions/assistant/responses#table_cards) -->
                <RichTableCard
                    v-if="component.tableCard"
                    :title="component.tableCard.title"
                    :subtitle="component.tableCard.subtitle"
                    :image-uri="component.tableCard.image.url"
                    :image-title="component.tableCard.image.accessibilityText"
                    :header="component.tableCard.columnProperties"
                    :rows="component.tableCard.rows"
                >
                    <RichCardButton
                        v-for="(button, button_id) in component.tableCard.buttons"
                        :key="button_id"
                        :uri="button.openUrlAction.url"
                        :title="button.title"
                    />
                </RichTableCard>
            </RichComponent>

            <!-- Visual Selection Responses (https://developers.google.com/actions/assistant/responses#visual_selection_responses) -->
            <RichComponent
                v-for="(component, component_id) in message.queryResult.webhookPayload
                    .google.systemIntent"
                :key="component_id"
                :fullwidth="component.carouselSelect !== undefined"
            >
                <!-- RichList (https://developers.google.com/actions/assistant/responses#list) -->
                <RichList
                    v-if="component.listSelect"
                    :title="component.listSelect.title"
                    :subtitle="component.listSelect.subtitle"
                >
                    <RichListItem
                        v-for="item in component.listSelect.items"
                        :key="item.optionInfo.key"
                        :title="item.title"
                        :description="item.description"
                        :image-uri="item.image.url"
                        :image-title="item.image.accessibilityText"
                        @click.native="send({ text: item.optionInfo.key })"
                    />
                </RichList>

                <!-- RichCarousel (https://developers.google.com/actions/assistant/responses#carousel) -->
                <RichCarousel v-if="component.carouselSelect">
                    <RichCard
                        v-for="item in component.carouselSelect.items"
                        :key="item.optionInfo.key"
                        :title="item.title"
                        :image-uri="item.image.url"
                        :image-title="item.image.accessibilityText"
                        :text="item.description"
                        @click.native="send({ text: item.optionInfo.key })"
                    />
                </RichCarousel>
            </RichComponent>
        </section>
    </div>
</template>
<script>
import RichComponent from '@/components/RichComponent.vue'
import RichBubble from '@/components/RichBubble.vue'
import RichCard from '@/components/RichCard.vue'
import RichCardButton from '@/components/RichCardButton.vue'
import RichCarousel from '@/components/RichCarousel.vue'
import RichList from '@/components/RichList.vue'
import RichListItem from '@/components/RichListItem.vue'
import RichPicture from '@/components/RichPicture.vue'
import RichMedia from '@/components/RichMedia.vue'
import RichTableCard from '@/components/RichTableCard.vue'

export default {
    name: 'BotMessage',
    components: {
        RichComponent,
        RichBubble,
        RichCard,
        RichCardButton,
        RichCarousel,
        RichList,
        RichListItem,
        RichPicture,
        RichMedia,
        RichTableCard
    },
    props: {
        message: {
            type: Object,
            required: false,
            default: () => {}
        },
        loading: {
            type: Boolean,
            required: false,
            default: false
        },
        training: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    methods: {
        showMsg(component){
            if (component.simpleResponses || component.listSelect || component.image){
                return true
            }
            if (component.tableCard){
                return true
            }
            if (component.payload && component.payload.richContent){
                return true
            }
            if (component.mediaContent && component.mediaContent.mediaObjects){
                return true
            }
            if (component.card || component.basicCard || component.rbmStandaloneRichCard){
                return true
            }
            if (component.carouselSelect || component.rbmCarouselRichCard){
                return true
            }
            if (component.text &&
                        !this.message.queryResult.fulfillmentMessages.find(t => t.message === 'simpleResponses')){
                return true
            }
            if (component.rbmText){
                return true
            }

            console.log(component)
            return false
        }
    }
}
</script>
