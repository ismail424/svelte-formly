<script lang="ts">
	import { Formly, type IField } from '$lib';
	// import { Formly, type IField } from 'svelte-formly-light';

	const form_name = 'my_form_a';
	const fields: IField[] = [
			{
			"type": "file",
			"name": "name-file",
			"attributes": {
				"id": "id-field",
				"classes": [
					"file-input file-input-bordered file-input-primary w-full",
					"dropzone-file",
					"cursor-pointer"
				],
				"label": "Upload File"
			},
			"extra": {
				"multiple": true, 
				"showPreview": true,
				"iconConfig": {
					"color": 'blue',
				}
			},
			"rules": ["file"], 
			"file": {
				"extensions": ["jpg", "gif", "png"],
				"maxSize": 5,
			}
		}
	];

	let data = {};
	const onSubmit = ({ detail }: any) => {
		console.log('detail onSubmit', detail);
		data = detail;
	};

	const onUpdate = ({ detail }: any) => {
		console.log('detail onUpdate', detail);
		data = detail;
	};
</script>

<!-- <pre><code>{JSON.stringify(data, null, 2)}</code></pre> -->

<div class="grid">
	<div class="col">
		<article>
			<hgroup>
				<h1>Sign in</h1>
				<h2>Nibh risus velit metus euismod vitae eu urna.</h2>
			</hgroup>
			<Formly {fields} {form_name} on:submit={onSubmit} on:update={onUpdate} realtime={false} />
		</article>
	</div>
</div>

<style lang="scss">
	:global(form .form-group) {
		margin-bottom: 1rem;
	}
</style>
