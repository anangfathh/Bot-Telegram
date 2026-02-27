<template>
  <Bar :data="data" :options="options" />
</template>

<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
)

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({}),
  },
})

const data = computed(() => ({
  labels: ['Users', 'Posts', 'Drivers', 'Ratings'],
  datasets: [
    {
      label: 'Total',
      backgroundColor: '#3b82f6', // primary blue
      borderRadius: 4,
      data: [
        props.stats.users || 0,
        props.stats.posts?.total || 0,
        props.stats.drivers?.total || 0,
        props.stats.ratings || 0,
      ],
    },
    {
      label: 'Active',
      backgroundColor: '#22c55e', // success green
      borderRadius: 4,
      data: [
        props.stats.users || 0, // Users are mostly active
        props.stats.posts?.active || 0,
        props.stats.drivers?.active || 0,
        0, // No "active" ratings concept
      ],
    },
  ],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        color: '#94a3b8', // muted foreground
        usePointStyle: true,
      },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    y: {
      grid: {
        color: '#1e293b', // darker grid lines
      },
      ticks: {
        color: '#94a3b8',
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#94a3b8',
      },
    },
  },
}
</script>
