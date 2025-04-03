/*const MediaComponent = {
    template: `
        <div class="media-gallery">
            <div v-if="medias.length > 0" class="media-grid">
                <div v-for="(media, index) in medias" :key="index" class="media-item">
                    <div v-if="media.tipo === 'imagem'" class="media-image">
                        <img :src="media.url" :alt="media.legenda">
                        <button @click="removerMedia(index)" class="delete-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div v-else-if="media.tipo === 'video'" class="media-video">
                        <video controls>
                            <source :src="media.url" type="video/mp4">
                        </video>
                        <button @click="removerMedia(index)" class="delete-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div v-if="media.legenda" class="media-caption">{{ media.legenda }}</div>
                </div>
            </div>
            <div v-else class="no-media">
                <p>Nenhuma mídia adicionada ainda.</p>
            </div>
            
            <div class="add-media">
                <h4><i class="fas fa-plus-circle"></i> Adicionar Mídia</h4>
                <select v-model="novaMidia.tipo">
                    <option value="imagem">Imagem</option>
                    <option value="video">Vídeo</option>
                </select>
                <input type="text" v-model="novaMidia.legenda" placeholder="Legenda">
                <input type="file" @change="handleFileUpload" accept="image/*,video/*">
                <button @click="adicionarMedia" :disabled="!novaMidia.arquivo">
                    <i class="fas fa-upload"></i> Adicionar
                </button>
            </div>
        </div>
    `,
    props: {
        medias: {
            type: Array,
            required: true
        }
    },
    setup(props, { emit }) {
        const novaMidia = reactive({
            tipo: 'imagem',
            legenda: '',
            arquivo: null
        });

        const handleFileUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    novaMidia.arquivo = {
                        url: e.target.result,
                        type: file.type
                    };
                };
                reader.readAsDataURL(file);
            }
        };

        const adicionarMedia = () => {
            if (novaMidia.arquivo) {
                const media = {
                    tipo: novaMidia.tipo,
                    url: novaMidia.arquivo.url,
                    legenda: novaMidia.legenda || 'Sem legenda'
                };
                emit('add-media', media);
                
                // Reset form
                novaMidia.legenda = '';
                novaMidia.arquivo = null;
                document.querySelector('.add-media input[type="file"]').value = '';
            }
        };

        const removerMedia = (index) => {
            emit('remove-media', index);
        };

        return {
            novaMidia,
            handleFileUpload,
            adicionarMedia,
            removerMedia
        };
    }
};