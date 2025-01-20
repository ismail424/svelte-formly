<script lang="ts">
	import { Formly, type IField } from 'svelte-formly-light';

	let loading: boolean = false;
	const form_name = 'my_form_a';

	const form_name_b = 'my_form_b';
	const fields_b: IField[] = [
		{
			type: 'input',
			name: 'country',
			attributes: {
				type: 'text',
				id: 'country',
				classes: ['form-control'],
				placeholder: 'Tap your country'
			},
			rules: ['required'],
			messages: {
				required: 'The country is required'
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
			<p>
				<code
					><i>fetch: </i><u
						>{#if loading}
							loading...
						{:else}
							done
						{/if}</u
					></code
				>
			</p>
		</article>
	</div>
	<div class="col">
		<article>
			<Formly
				fields={fields_b}
				form_name={form_name_b}
				on:submit={onSubmit}
				on:update={onUpdate}
				realtime={true}
			/>
		</article>
		<p>test</p>
	</div>
</div>
