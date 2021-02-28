<template>
  <div>
    <div class="search-box">
      <input
        id="search-gif"
        v-model="searchTerm"
        autofocus
        type="text"
        placeholder="Search.."
        @keyup.enter="getGifs()"
      />
      <button class="button" @click="getGifs()">
        <i class="material-icons" aria-hidden="true">search</i>
      </button>
    </div>
    <div class="gif-container">
      <img v-for="gif in gifs" :key="gif.id" :src="gif" @click="select(gif)" />
    </div>
  </div>
</template>
<script>
export default {
  name: 'GiphySearch',
  props: {
    api: {
      type: String,
      required: false,
      default: ''
    }
  },
  data() {
    return {
      searchTerm: '',
      gifs: []
    }
  },
  mounted() {
    console.log('API', this.api)
    const element = this.$el.querySelector('#search-gif')
    if (element) {
      this.$nextTick(() => {
        element.focus()
      })
    }
  },
  methods: {
    select(gif) {
      this.$emit('select', gif)
    },
    getGifs() {
      const limit = 5
      const url = `/api/giphy?q=${this.searchTerm}&limit=${limit}&api=${this.api}`
      fetch(url)
        .then(response => {
          return response.json()
        })
        .then(json => {
          this.buildGifs(json)
        })
        .catch(err => console.log(err))
    },
    buildGifs(json) {
      this.gifs = json.data
        .map(gif => gif.id)
        .map(gifId => {
          return `https://media.giphy.com/media/${gifId}/giphy.gif`
        })
    }
  }
}
</script>

<style scoped>
.gif-container {
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
}
.gif-container img {
  margin: 2px;
  max-width: 30%;
  max-height: 200px;
}
.gif-container img:hover {
  box-shadow: 0 0 100px gold;
  transition: 0.25s;
  z-index: 999;
  cursor: pointer;
}
.search-box {
  display: flex;
}
.search-box input {
  padding: 10px;
  font-size: 17px;
  border: 1px solid grey;
  float: left;
  width: 80%;
  background: #f1f1f1;
}

.search-box button {
  float: left;
  width: 20%;
  height: 100%;
  padding: 10px;
  background: #2196f3;
  color: white;
  font-size: 17px;
  border: 1px solid grey;
  border-left: none;
  cursor: pointer;
}

.search-box button:hover {
  background: #0b7dda;
}

.search-box .example::after {
  content: '';
  clear: both;
  display: table;
}
</style>
