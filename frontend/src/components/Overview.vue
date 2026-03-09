<template>
  <Line :data="data" :options="options" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { Line } from "vue-chartjs";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps({
  traffic: {
    type: Array,
    default: () => [],
  },
});
const palette = ref({
  foreground: "#111827",
  muted: "#64748b",
  border: "#d7deeb",
});
let observer = null;

const syncPalette = () => {
  const styles = getComputedStyle(document.body);
  const foregroundVar = styles.getPropertyValue("--foreground").trim();
  const mutedVar = styles.getPropertyValue("--muted-foreground").trim();
  const borderVar = styles.getPropertyValue("--border").trim();

  palette.value = {
    foreground: foregroundVar ? `hsl(${foregroundVar})` : "#111827",
    muted: mutedVar ? `hsl(${mutedVar})` : "#64748b",
    border: borderVar ? `hsl(${borderVar})` : "#d7deeb",
  };
};

const labels = computed(() => props.traffic.map((item) => item.label));

const data = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: "Posts",
      data: props.traffic.map((item) => item.totalPosts),
      borderColor: palette.value.foreground,
      backgroundColor: palette.value.foreground.replace(")", " / 0.1)"),
      fill: true,
      tension: 0.42,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: palette.value.foreground,
    },
    {
      label: "Unique Posters",
      data: props.traffic.map((item) => item.uniquePosters),
      borderColor: palette.value.muted,
      borderDash: [5, 4],
      tension: 0.42,
      borderWidth: 1.5,
      pointRadius: 0,
      fill: false,
    },
  ],
}));

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: "index",
  },
  plugins: {
    legend: {
      position: "top",
      align: "end",
      labels: {
        color: palette.value.muted,
        usePointStyle: true,
        boxWidth: 8,
        boxHeight: 8,
        font: {
          family: "'Manrope', sans-serif",
          weight: "600",
        },
      },
    },
    tooltip: {
      mode: "index",
      intersect: false,
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      titleFont: { family: "'Manrope', sans-serif", size: 13 },
      bodyFont: { family: "'Manrope', sans-serif", size: 12 },
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    y: {
      grid: {
        color: `${palette.value.border.replace(")", " / 0.65)")}`,
        drawBorder: false,
      },
      ticks: {
        color: palette.value.muted,
        font: { family: "'Manrope', sans-serif" },
        maxTicksLimit: 6,
      },
      border: { display: false },
    },
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: palette.value.muted,
        font: { family: "'Manrope', sans-serif", weight: "600" },
      },
      border: { display: false },
    },
  },
}));

onMounted(() => {
  syncPalette();
  observer = new MutationObserver(syncPalette);
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>
