<template>
  <div class="container mx-auto">
    <header class="p-4 shadow-sm">
      <a @click="$router.go(-1)"
        ><div class="inline-block text-lg"><h1>< Back</h1></div></a
      >
    </header>
    <tabs>
      <tab title="Resources">
        <div class="container mt-4 mx-auto">
          <div
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            <div
              v-for="resource in resources"
              v-bind:key="resource.name"
              class="card m-2 cursor-pointer border border-gray-400 rounded-lg hover:shadow-md hover:border-opacity-0 transform hover:-translate-y-1 transition-all duration-200"
            >
              <div class="m-3">
                <h2 class="text-lg mb-2">
                  {{ resource.name }}
                </h2>
                <p
                  class="font-light text-sm text-gray-700 hover:text-gray-900 transition-all duration-200"
                >
                  {{ resource.desc }}
                </p>
                <div>
                  <div v-if="resource.tel">
                    <a :href="resource.tel">Call Now</a>
                  </div>
                  <div v-if="resource.sms">
                    <a :href="resource.sms">SMS Now</a>
                  </div>
                  <div v-if="resource.link">
                    <a :href="resource.link" target="_blank">View Website</a>
                  </div>
                  <div v-if="resource.email">
                    <a :href="resource.email">Email</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p>Know an organisation or group that should be listed here?</p>
          <a href="/#/?mode=feedback">
              Suggest a resource
          </a>
        </div>
      </tab>
      <tab title="Topics">
        <input v-model="topicFilter" type="text" placeholder="Filter topics" />
        <div class="container mt-4 mx-auto">
          <div
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            <div
              v-for="topic in topicListFiltered"
              v-bind:key="topic.topic"
              class="card m-2 cursor-pointer border border-gray-400 rounded-lg hover:shadow-md hover:border-opacity-0 transform hover:-translate-y-1 transition-all duration-200"
            >
              <div class="m-3">
                <h2 class="text-lg mb-2">
                  {{ topic.topic }}
                </h2>
                <div
                  v-for="resource in topic.resources"
                  v-bind:key="resource.name" class="font-light text-sm text-gray-700 "
                >
                {{resource.name}}
                  <div v-if="resource.tel">
                    <a :href="resource.tel">Call Now</a>
                  </div>
                  <div v-if="resource.sms">
                    <a :href="resource.sms">SMS Now</a>
                  </div>
                  <div v-if="resource.link">
                    <a :href="resource.link" target="_blank">View Website</a>
                  </div>
                  <div v-if="resource.email">
                    <a :href="resource.email">Email</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </tab>
    </tabs>
  </div>
</template>
<script>
import Tabs from '@/components/Tabs'
import Tab from '@/components/Tab'
import * as axios from 'axios'
import '@/style/index.css'
export default {
  name: 'Resources',
  components: { Tabs, Tab },
  data() {
    return {
      topicFilter: '',
      resources: [],
      topics: [],
      topicList: []
    }
  },
  async beforeMount() {
    const [resources, topics] = await Promise.all([
      axios.default.get('/api/resources'),
      axios.default.get('/api/topics')
    ])

    this.topics = topics.data.sort((a, b) => {
      return a.topic.localeCompare(b.topic)
    })
    this.resources = resources.data
      .sort((a, b) => {
        return a.name.localeCompare(b.name)
      })
      .map(t => {
        return {
          ...t,
          topics: this.topics
            .filter(r => r.resource_name[0] === t.name)
            .map(s => s.topic)
        }
      })
    this.topicList = [...new Set(this.topics.map(t=>t.topic))].map(r=>{
      return {topic: r, resources: this.resources.filter(s=>s.topics.find(q=>q===r))}
    })
    // console.log(this.topicList)
    // console.log(this.resources)
  },
  methods: {
    reload() {
      window.location.reload()
    }
  },
  computed: {
    topicListFiltered() {
      console.log(this.topicFilter)
      return this.topicList.filter(t => t.topic.toLowerCase(0).match(this.topicFilter.toLowerCase()))
    }
  }
}
</script>
<style>
</style>
