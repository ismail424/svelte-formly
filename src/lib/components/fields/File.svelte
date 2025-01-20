<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import type { IField } from '../../utils';

    export let field: IField;

    let files: any[] = [];
    let multiple = false;
    let showPreview = false;
    let inputFile: any;

    const dispatch = createEventDispatcher();
    let iconConfig = {
        color: 'currentColor',
        opacity: 0.6,
        strokeWidth: 2,
        size: 'w-4 h-4',
        additionalClasses: '',
        additionalStyles: ''
    };

    onMount(() => {
        if (field.extra) {
            multiple = field.extra.multiple ? field.extra.multiple : null;
            showPreview = field.extra.showPreview ? field.extra.showPreview : null;

            if (field.extra.iconConfig) {
                iconConfig = {
                    ...iconConfig,
                    ...field.extra.iconConfig
                };
            }
        }
    });

    function deleteFile(file: File) {
        let newValue;
        files = files.filter((i) => i.name != file.name);
        if (files.length === 0) {
            inputFile.value = null;
            newValue = null;
        } else {
            newValue = files;
        }

        dispatch('changeValue', {
            name: field.name,
            value: newValue
        });
    }

    const onInput = async (
        event: Event & { currentTarget: EventTarget & HTMLInputElement }
    ): Promise<void> => {
        files = Array.from(event.currentTarget.files as ArrayLike<File>);

        dispatch('changeValue', {
            name: field.name,
            value: files
        });
    };
    function formatFileSize(bytes: number) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    function getImageResolution(file: File): Promise<string> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function() {
                const resolution = `${img.naturalWidth} × ${img.naturalHeight}`;
                resolve(resolution);
            };
            img.src = window.URL.createObjectURL(file);
        });
    }

    let imageResolution = '';

    $: {
        if (files && files.length > 0 && files[0].type.startsWith('image/')) {
            getImageResolution(files[0]).then(res => {
                imageResolution = res;
            });
        }
    }
</script>

<input
    type={field.type}
    name={field.name}
    id={field.attributes.id}
    class={field.attributes.classes?.join(' ')}
    {multiple}
    on:input={onInput}
    bind:this={inputFile}
/>

{#if field.file}
    <div class="file-rules">
        <ul>
            {#each Object.entries(field.file) as [rule, ruleValue]}
                <li><strong>{rule}</strong>: {ruleValue}</li>
            {/each}
        </ul>
    </div>
{/if}

{#if showPreview}
    {#if files}
        <div class="list-files">
            {#each files as file, i}
                <div class="file">
                    <div class="img">
                        <img src={window.URL.createObjectURL(file)} alt={file.name} />
                    </div>
                    <div class="infos">
                        <div class="flex flex-col gap-2">
                            <!-- Filename -->
                            <div class="font-medium truncate" title={file.name}>
                                <svg 
                                    class={`inline-block mr-1 opacity-${iconConfig.opacity * 100} ${iconConfig.size} ${iconConfig.additionalClasses}`} 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke={iconConfig.color} 
                                    stroke-width={iconConfig.strokeWidth}
                                    style={iconConfig.additionalStyles}
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                                </svg>
                                {file.name}
                            </div>
                            
                            <!-- File details -->
                            <div class="flex flex-wrap gap-3 text-sm text-base-content/60">
                                <!-- File type -->
                                <div class="flex items-center gap-1">
                                    <svg 
                                        class={`opacity-${iconConfig.opacity * 100} ${iconConfig.size} ${iconConfig.additionalClasses}`} 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke={iconConfig.color} 
                                        stroke-width={iconConfig.strokeWidth}
                                        style={iconConfig.additionalStyles}
                                    >
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                    <span>{file.type}</span>
                                </div>
                                
                                <!-- File size -->
                                <div class="flex items-center gap-1">
                                    <svg 
                                        class={`opacity-${iconConfig.opacity * 100} ${iconConfig.size} ${iconConfig.additionalClasses}`} 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke={iconConfig.color} 
                                        stroke-width={iconConfig.strokeWidth}
                                        style={iconConfig.additionalStyles}
                                    >
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-3.75-3.75 3.75-3.75-3.75-3.75 3.75V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0h.008v.008h-.008V9Zm.375 0h.008v.008h-.008V9Z" />
                                    </svg>
                                    <span>{formatFileSize(file.size)}</span>
                                </div>
                                
                                <!-- Resolution for images -->
                                {#if file.type.startsWith('image/')}
                                    <div class="flex items-center gap-1">
                                        <svg 
                                            class={`opacity-${iconConfig.opacity * 100} ${iconConfig.size} ${iconConfig.additionalClasses}`} 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke={iconConfig.color} 
                                            stroke-width={iconConfig.strokeWidth}
                                            style={iconConfig.additionalStyles}
                                        >
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0h.008v.008h-.008V8.25zm-.375.375h.008v.008h-.008V8.625zm.375 0h.008v.008h-.008V8.625z" />
                                        </svg>
                                        <span>{imageResolution}</span>
                                    </div>
                                {/if}
                            </div>
                    
                            <!-- Remove button -->
                            <div>
                                <button
                                type="button"
                                class="btn btn-sm btn-error btn-outline w-full sm:w-auto"
                                on:click|preventDefault={() => deleteFile(file)}
                            >
                                <svg class="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                                Remove
                            </button>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
{/if}