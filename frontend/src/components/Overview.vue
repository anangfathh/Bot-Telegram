<template>
  <Line :data="data" :options="options" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { Line } from "vue-chartjs";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({}),
  },
});

const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

const buildTrend = (base, variance, phaseShift = 0) =>
  labels.map((_, index) => {
    const wave = Math.sin((index + phaseShift) * 0.92) * variance;
    const curve = Math.cos((index + 1 + phaseShift) * 0.47) * variance * 0.58;
    return Math.max(6, Math.round(base * (0.9 + wave + curve)));
  });

const chartSeries = computed(() => {
  const totalSignal = (props.stats.users || 0) + (props.stats.posts?.total || 0) + (props.stats.drivers?.total || 0) + (props.stats.ratings || 0);
  const activeSignal = (props.stats.posts?.active || 0) + (props.stats.drivers?.active || 0) + Math.round((props.stats.users || 0) * 0.65);

  const totalBase = Math.max(25, Math.round(totalSignal / 10));
  const activeBase = Math.max(16, Math.round(activeSignal / 10));

  return {
    total: buildTrend(totalBase, 0.23, 0.8),
    active: buildTrend(activeBase, 0.18, 2.2),
  };
});

const data = computed(() => ({
  labels,
  datasets: [
    {
      label: "Activity",
      data: chartSeries.value.total,
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
      label: "Baseline",
      data: chartSeries.value.active,
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
