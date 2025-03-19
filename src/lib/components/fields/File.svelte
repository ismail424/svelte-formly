<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import type { IField } from '../../utils';

    interface FileMetadataDetail {
        icon: string;
        text: string;
    }

    interface FileMetadataInfo {
        icon: string;
        color: string;
        details: FileMetadataDetail[];
    }

    interface StoredFile {
        name: string;
        url: string;
        path?: string;
        type: string;
        size: number;
        isStoredFile: true;
        fileId: string;
        id?: string;
        previewUrl?: string;
    }

    interface NewFile {
        name: string;
        type: string;
        size: number;
        blob: File;
        fileId: string;
        isStoredFile?: false;
    }

    type UploadFile = StoredFile | NewFile;

    export let field: IField;

    let storedFiles: StoredFile[] = [];
    let newFiles: NewFile[] = [];
    let multiple = false;
    let maxFiles = 1;
    let inputFile: HTMLInputElement;
    let errors: string[] = [];
    const dispatch = createEventDispatcher<{
        changeValue: { name: string; value: NewFile | NewFile[] | null };
    }>();
    let fileMetadata: Map<string, FileMetadataInfo> = new Map();

    onMount(() => {
        try {
            if (field.value) {
                storedFiles = processStoredFiles(field.value);
                storedFiles.forEach(getFileMetadata);
            }
            multiple = field.extra?.multiple || false;
            maxFiles = field.file?.maxSize || 1;
        } catch (e) {
            console.error('Initialization error:', e);
            errors = ['Failed to initialize file upload'];
        }
    });

    function generateUniqueId(file: File | UploadFile, prefix = ''): string {
        return `${prefix}-${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
 
    function processStoredFiles(initialValue: any): StoredFile[] {
        const fileArray = Array.isArray(initialValue) ? initialValue : [initialValue];
        
        return fileArray
            .filter(value => value && (value.path || value.url || value.previewUrl || value.id))
            .map(value => ({
                name: value.name || value.filename || 'unnamed-file',
                url: value.previewUrl || value.path || value.url || `/api/files/${value.id || value.fileId}`,
                path: value.path,
                type: value.type || value.mimeType || 'application/octet-stream',
                size: value.size || 0,
                isStoredFile: true as const,
                fileId: value.fileId || value.id || generateUniqueId(value, 'stored'),
                id: value.id || value.fileId
            }));
    }
 
    function validateNewFile(file: UploadFile, totalCount: number): string | null {
        const allowedExtensions = field.file?.extensions || [];
        const maxSize = (field.file?.maxSize || 5) * 1024 * 1024;
        
        if (totalCount > maxFiles) {
            return `Maximum ${maxFiles} files allowed (${storedFiles.length} already stored)`;
        }
        
        const ext = (file.name?.split('.').pop() || '').toLowerCase();
        if (allowedExtensions.length && !allowedExtensions.includes(ext)) {
            return `Only ${allowedExtensions.join(', ')} files are allowed`;
        }
        
        if (file.size > maxSize) {
            return `File size must be less than ${(field.file?.maxSize || 0)}MB`;
        }
        
        return null;
    }
 
    const onInput = async (event: Event) => {
        errors = [];
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;
        
        const uploadedFiles: NewFile[] = Array.from(input.files).map(file => ({
            name: file.name,
            type: file.type,
            size: file.size,
            blob: file,
            fileId: generateUniqueId(file, 'new')
        }));

        console.log('Uploaded files:', uploadedFiles);
        
        const totalFilesCount = storedFiles.length + newFiles.length + uploadedFiles.length;
        
        if (totalFilesCount > maxFiles) {
            errors.push(`Maximum ${maxFiles} files allowed (${storedFiles.length} already stored)`);
            if (inputFile) inputFile.value = '';
            return;
        }
        
        for (const file of uploadedFiles) {
            const error = validateNewFile(file, storedFiles.length + newFiles.length + 1);
            if (error) {
                errors.push(error);
                if (inputFile) inputFile.value = '';
                return;
            }
        }
 
        if (multiple) {
            newFiles = [...newFiles, ...uploadedFiles];
        } else {
            newFiles = uploadedFiles;
        }
 
        uploadedFiles.forEach(getFileMetadata);
        
        const dispatchFiles = newFiles.map(file => ({
            ...file,
            blob: file.blob
        }));

        dispatch('changeValue', {
            name: field.name,
            value: multiple ? dispatchFiles : dispatchFiles[0]
        });
    };

    async function deleteStoredFile(file: StoredFile) {
        errors = [];
        
        if (!file.isStoredFile) return;

        const fileId = file.id || file.fileId;
        if (!fileId) {
            console.error('No file ID found:', file);
            errors.push('Failed to delete file: No ID');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('fileUrl', fileId);
            formData.append('fieldName', field.name);

            const response = await fetch('?/delete', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to delete file');
            }

            storedFiles = storedFiles.filter((i) => i.fileId !== file.fileId);
            fileMetadata.delete(file.fileId);
        } catch (err) {
            console.error('Error deleting file:', err);
            errors.push('Failed to delete file');
        }
    }

    function deleteNewFile(file: NewFile) {
        newFiles = newFiles.filter((i) => i.fileId !== file.fileId);
        fileMetadata.delete(file.fileId);
        if (inputFile) inputFile.value = '';
        
        const dispatchFiles = newFiles.map(f => ({
            ...f,
            blob: f.blob
        }));

        dispatch('changeValue', {
            name: field.name,
            value: multiple ? dispatchFiles : (dispatchFiles[0] || null)
        });
    }
 
    function getFileMetadata(file: UploadFile) {
        if (!file?.name) return;

        const metadata: FileMetadataInfo = {
            icon: '📎',
            color: 'text-gray-500',
            details: []
        };

        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const typeInfo = getFileTypeInfo(ext);
        metadata.icon = typeInfo.icon;
        metadata.color = typeInfo.color;

        if (file.size) {
            metadata.details.push({
                icon: '📊',
                text: formatFileSize(file.size)
            });
        }

        if (file.type) {
            metadata.details.push({
                icon: '📄',
                text: file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN'
            });
        }

        if (file.type?.startsWith('image/')) {
            getImageResolution(file).then(res => {
                metadata.details.push({
                    icon: '📏',
                    text: res
                });
                fileMetadata.set(file.fileId, metadata);
                fileMetadata = fileMetadata;
            });
        }

        fileMetadata.set(file.fileId, metadata);
    }
 
    interface FileTypeInfo {
        icon: string;
        color: string;
    }

    function getFileTypeInfo(ext: string): FileTypeInfo {
        const types: Record<string, FileTypeInfo> = {
            jpg: { icon: '🖼️', color: 'text-blue-500' },
            jpeg: { icon: '🖼️', color: 'text-blue-500' },
            png: { icon: '🖼️', color: 'text-blue-500' },
            gif: { icon: '🖼️', color: 'text-purple-500' },
            pdf: { icon: '📄', color: 'text-red-500' },
            doc: { icon: '📝', color: 'text-blue-600' },
            docx: { icon: '📝', color: 'text-blue-600' },
            txt: { icon: '📄', color: 'text-gray-600' },
            default: { icon: '📎', color: 'text-gray-500' }
        };
        return types[ext] || types.default;
    }
 
    function getImageResolution(file: UploadFile): Promise<string> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function () {
                resolve(`${img.naturalWidth} × ${img.naturalHeight}`);
                URL.revokeObjectURL(img.src);
            };
            const fileUrl = 'isStoredFile' in file && file.isStoredFile 
                ? file.url 
                : URL.createObjectURL((file as NewFile).blob);
            img.src = fileUrl;
        });
    }
  
    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
</script>

<div class="w-full space-y-4">
    <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
            <span class="opacity-70">Files:</span>
            <span class="font-medium">{storedFiles.length + newFiles.length} / {maxFiles}</span>
        </div>
        {#if field.file}
            <div class="flex items-center gap-2">
                <span class="opacity-70">Max Size:</span>
                <span class="font-medium">{field.file.maxSize}MB</span>
            </div>
        {/if}
    </div>

    {#if errors.length > 0}
        <div class="alert alert-error">
            {#each errors as error}
                <p>{error}</p>
            {/each}
        </div>
    {/if}

    {#if storedFiles.length > 0}
        <div class="mb-4">
            <h3 class="text-sm font-medium mb-2">Stored Files</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {#each storedFiles as file (file.fileId)}
                    <div class="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
                        <div class="p-3">
                            {#if file.type?.startsWith('image/')}
                                <div class="aspect-square w-full mb-2">
                                    <img 
                                        src={file.url} 
                                        alt={file.name} 
                                        class="w-full h-full object-contain bg-base-300 rounded"
                                    />
                                </div>
                            {:else}
                                <div class="aspect-square w-full mb-2 flex items-center justify-center bg-base-300 rounded text-2xl">
                                    {(fileMetadata.get(file.fileId) || {}).icon || '📎'}
                                </div>
                            {/if}

                            <div class="space-y-1">
                                <p class="text-xs font-medium truncate {(fileMetadata.get(file.fileId) || {}).color}" title={file.name}>
                                    {file.name}
                                </p>
                                {#if fileMetadata.get(file.fileId)?.details}
                                    <div class="grid grid-cols-2 gap-1 text-[10px] opacity-70">
                                        {#each fileMetadata.get(file.fileId)?.details || [] as detail}
                                            <div class="flex items-center gap-1" title={detail.text}>
                                                <span>{detail.icon}</span>
                                                <span class="truncate">{detail.text}</span>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                                <button
                                    type="button"
                                    class="btn btn-xs btn-error btn-outline w-full mt-2"
                                    on:click={() => deleteStoredFile(file)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <div class="flex flex-col gap-2">
        <input
            type="file"
            name={field.name}
            id={field.attributes?.id}
            class={field.attributes?.classes?.join(' ')}
            {multiple}
            on:change={onInput}
            bind:this={inputFile}
            accept={field.file?.extensions ? '.' + field.file.extensions.join(',.') : undefined}
            disabled={storedFiles.length + newFiles.length >= maxFiles}
        />
        
        <div class="text-xs opacity-70 space-y-1">
            {#if field.file}
                <p>Allowed: {field.file?.extensions?.join(', ') ?? 'None'}</p>
            {/if}
            {#if multiple}
                <p>
                    {#if storedFiles.length + newFiles.length >= maxFiles}
                        Maximum file limit reached ({maxFiles} files)
                    {:else}
                        Can add {maxFiles - (storedFiles.length + newFiles.length)} more file(s)
                    {/if}
                </p>
            {/if}
        </div>
    </div>

    {#if newFiles.length > 0}
    <div class="mt-4">
        <h3 class="text-sm font-medium mb-2">New Files</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {#each newFiles as file (file.fileId)}
                <div class="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
                    <div class="p-3">
                        {#if file.type?.startsWith('image/')}
                            <div class="aspect-square w-full mb-2">
                                <img 
                                    src={URL.createObjectURL(file.blob)} 
                                    alt={file.name} 
                                    class="w-full h-full object-contain bg-base-300 rounded"
                                />
                            </div>
                        {:else}
                            <div class="aspect-square w-full mb-2 flex items-center justify-center bg-base-300 rounded text-2xl">
                                {(fileMetadata.get(file.fileId) || {}).icon || '📎'}
                            </div>
                        {/if}

                        <div class="space-y-1">
                            <p class="text-xs font-medium truncate {(fileMetadata.get(file.fileId) || {}).color}" title={file.name}>
                                {file.name}
                            </p>
                            <!-- File Metadata -->
                            {#if fileMetadata.get(file.fileId)?.details}
                                <div class="grid grid-cols-2 gap-1 text-[10px] opacity-70">
                                    {#each fileMetadata.get(file.fileId)?.details || [] as detail}
                                        <div class="flex items-center gap-1" title={detail.text}>
                                            <span>{detail.icon}</span>
                                            <span class="truncate">{detail.text}</span>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                            <button
                                type="button"
                                class="btn btn-xs btn-error btn-outline w-full mt-2"
                                on:click={() => deleteNewFile(file)}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
{/if}
</div>