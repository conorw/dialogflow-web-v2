<template>
  <!-- My message -->
  <RichComponent me>
    <RichBubble
      v-if="message.queryResult.queryText"
      :text="message.queryResult.queryText"
      me
    />
  </RichComponent>
</template>
<script>
import RichComponent from '@/components/RichComponent.vue'
import RichBubble from '@/components/RichBubble.vue'

export default {
  name: 'MyMessage',
  components: {
    RichComponent,
    RichBubble
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
    }
  }
}
</script>
