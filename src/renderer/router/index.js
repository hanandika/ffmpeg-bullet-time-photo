import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: require('@/components/LandingPage').default
    },
    {
      path: '/new-project',
      name: 'new-project',
      component: require('@/components/ProjectNewPage').default
    },
    {
      path: '/project/:projectID',
      name: 'project',
      component: require('@/components/ProjectPage').default
    },
    {
      path: '/project-send/:projectID',
      name: 'project-send',
      component: require('@/components/ProjectSendPage').default
    },
    {
      path: '/monitor-video/:projectID',
      name: 'monitor-video',
      component: require('@/components/MonitorVideo').default
    },
    {
      path: '/monitor-send/:projectID',
      name: 'monitor-send',
      component: require('@/components/MonitorSend').default
    },
  ]
})
