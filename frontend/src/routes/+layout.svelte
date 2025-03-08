<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>Serverless Boilerplate</title>
</svelte:head>

{@render children()}
