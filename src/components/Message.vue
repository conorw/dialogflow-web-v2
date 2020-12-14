<template>
    <div>
        <div id="message">
            <!-- My message -->
            <MyMessage :message="message" />
            <BotMessage :message="message" :training="training" />
        </div>
    </div>
</template>
<script>
import MyMessage from '@/components/MyMessage'
import BotMessage from '@/components/BotMessage'

export default {
    name: 'Message',
    components: {
        MyMessage,
        BotMessage
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
    }
}
</script>

