<template>
  <div class="background-container">
    <h3 style="text-align: center">
      Images designed by
      <a href="https://speckyboy.com/" target="_blank">Speckyboy.com</a>
    </h3>
    <img
      v-for="background in backgrounds"
      :key="background"
      :src="background"
      @click="select(background)"
    />
  </div>
</template>
<script>
export default {
  name: 'ChooseAvatar',
  props: {
    current: {
      type: String,
      required: false,
      default: ''
    }
  },
  data() {
    return {
      backgrounds: [
        '/img/avatars/PNG/1 (2).png',
        '/img/avatars/PNG/1 (3).png',
        '/img/avatars/PNG/1 (4).png',
        '/img/avatars/PNG/1 (5).png',
        '/img/avatars/PNG/1 (6).png',
        '/img/avatars/PNG/1 (7).png',
        '/img/avatars/PNG/1 (8).png',
        '/img/avatars/PNG/1 (9).png',
        '/img/avatars/PNG/1 (10).png',
        '/img/avatars/PNG/1 (12).png',
        '/img/avatars/PNG/1 (14).png',
        '/img/avatars/PNG/1 (15).png',
        '/img/avatars/PNG/1 (19).png',
        '/img/avatars/PNG/1 (21).png',
        '/img/avatars/PNG/1 (25).png',
        '/img/avatars/PNG/1 (29).png',
        '/img/avatars/PNG/1 (30).png',
        '/img/avatars/PNG/1 (31).png',
        '/img/avatars/PNG/1 (32).png',
        '/img/avatars/PNG/1 (33).png',
        '/img/avatars/PNG/1 (35).png',
        '/img/avatars/PNG/1 (36).png',
        '/img/avatars/PNG/1 (37).png',
        '/img/avatars/PNG/1 (38).png',
        '/img/avatars/PNG/1 (39).png',
        '/img/avatars/PNG/1 (40).png',
        '/img/avatars/PNG/1 (41).png',
        '/img/avatars/PNG/1 (44).png',
        '/img/avatars/PNG/1 (45).png',
        '/img/avatars/PNG/1 (46).png',
        '/img/avatars/PNG/1 (47).png',
        '/img/avatars/PNG/1 (48).png',
        '/img/avatars/PNG/1 (49).png',
        '/img/avatars/PNG/1 (50).png',
        '/img/avatars/PNG/1 (51).png',
        '/img/avatars/PNG/1 (52).png',
        '/img/avatars/PNG/1 (53).png',
        '/img/avatars/PNG/1 (54).png',
        '/img/avatars/PNG/1 (55).png',
        '/img/avatars/PNG/1 (56).png',
        '/img/avatars/PNG/1 (57).png',
        '/img/avatars/PNG/1 (58).png',
        '/img/avatars/PNG/1 (59).png',
        '/img/avatars/PNG/1 (60).png',
        '/img/avatars/PNG/1 (61).png',
        '/img/avatars/PNG/1 (62).png',
        '/img/avatars/PNG/1 (63).png',
        '/img/avatars/PNG/1 (64).png',
        '/img/avatars/PNG/1 (65).png',
        '/img/avatars/PNG/1 (66).png',
        '/img/avatars/PNG/1 (67).png',
        '/img/avatars/PNG/1 (68).png',
        '/img/avatars/PNG/1 (69).png',
        '/img/avatars/PNG/1 (70).png',
        '/img/avatars/PNG/1 (71).png',
        '/img/avatars/PNG/1 (72).png',
        '/img/avatars/PNG/1 (73).png',
        '/img/avatars/PNG/1 (74).png',
        '/img/avatars/PNG/1 (75).png',
        '/img/avatars/PNG/1 (76).png',
        '/img/avatars/PNG/1 (77).png',
        '/img/avatars/SVG/flat/03-pirates.svg',
        '/img/avatars/SVG/flat/04-girl.svg',
        '/img/avatars/SVG/flat/05-boy.svg',
        '/img/avatars/SVG/flat/08-police.svg',
        '/img/avatars/SVG/flat/10-girl.svg',
        '/img/avatars/SVG/flat/13-rock.svg',
        '/img/avatars/SVG/flat/14-boy.svg',
        '/img/avatars/SVG/flat/16-girl.svg',
        '/img/avatars/SVG/flat/18-baby.svg',
        '/img/avatars/SVG/flat/20-clown.svg',
        '/img/avatars/SVG/flat/22-portuguese.svg',
        '/img/avatars/SVG/flat/24-girl.svg',
        '/img/avatars/SVG/flat/27-ninja.svg',
        '/img/avatars/SVG/flat/29-girl.svg',
        '/img/avatars/SVG/flat/30-viking.svg',
        '/img/avatars/SVG/flat/31-boy.svg',
        '/img/avatars/SVG/flat/36-user.svg',
        '/img/avatars/SVG/flat/37-dj.svg',
        '/img/avatars/SVG/flat/38-girl.svg',
        '/img/avatars/SVG/flat/39-girl.svg',
        '/img/avatars/SVG/flat/41-cowboy.svg',
        '/img/avatars/SVG/flat/43-santa clause.svg',
        '/img/avatars/SVG/flat/45-doctor.svg',
        '/img/avatars/SVG/flat/47-scientist.svg'
      ]
    }
  },
  methods: {
    select(avatar) {
      localStorage.setItem('avatar', avatar)
      this.$emit('avatar', avatar)
    }
  }
}
</script>

<style scoped>
.background-container {
  height: 100%;
  overflow: auto;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
}
.background-container img {
  margin: 2px;
  width: 60px;
  max-height: 60px;
}
</style>
