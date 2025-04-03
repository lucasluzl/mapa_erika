const { createApp, ref, reactive, onMounted } = Vue;

// Componente de mídia (será registrado mais tarde)
const MediaComponent = {
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

// Aplicação principal
createApp({
    components: {
        'media-component': MediaComponent
    },
    setup() {
        const codigoIbge = ref('');
        const municipio = reactive({
            codigo_ibge: '',
            nome: '',
            uf: '',
            descricao: '',
            medias: [],
            bounds: null
        });
        const municipioCarregado = ref(false);
        let map = null;
        let municipioLayer = null;

        onMounted(() => {
            // Inicializar o mapa
            map = L.map('map').setView([-15.788, -47.879], 4);
            
            // Adicionar tile layer (OpenStreetMap)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
        });

        const carregarMunicipio = async () => {
            if (!codigoIbge.value) return;
            
            try {
                // Limpar mapa anterior
                if (municipioLayer) {
                    map.removeLayer(municipioLayer);
                }
                
                // Carregar geometria do município
                const response = await fetch(`https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${codigoIbge.value}?formato=application/vnd.geo+json`);
                const geojson = await response.json();
                
                // Carregar informações do município
                const infoResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${codigoIbge.value}`);
                const info = await infoResponse.json();
                
                // Atualizar dados do município
                municipio.codigo_ibge = codigoIbge.value;
                municipio.nome = info.nome;
                municipio.uf = info.microrregiao.mesorregiao.UF.sigla;
                municipio.bounds = L.geoJSON(geojson).getBounds();
                
                // Adicionar camada do município ao mapa
                municipioLayer = L.geoJSON(geojson, {
                    style: {
                        fillColor: '#3388ff',
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.7
                    }
                }).addTo(map);
                
                // Ajustar visão do mapa para o município
                map.fitBounds(municipio.bounds);
                
                // Adicionar popup
                municipioLayer.bindPopup(`<h3>${municipio.nome} - ${municipio.uf}</h3><p>Código IBGE: ${municipio.codigo_ibge}</p>`);
                
                // Carregar dados salvos localmente
                carregarDadosLocais();
                
                municipioCarregado.value = true;
            } catch (error) {
                console.error('Erro ao carregar município:', error);
                alert('Município não encontrado. Verifique o código IBGE.');
            }
        };

        const carregarDadosLocais = () => {
            const dados = localStorage.getItem(`municipio_${municipio.codigo_ibge}`);
            if (dados) {
                const parsed = JSON.parse(dados);
                municipio.descricao = parsed.descricao || '';
                municipio.medias = parsed.medias || [];
            }
        };

        const salvarDadosLocais = () => {
            localStorage.setItem(`municipio_${municipio.codigo_ibge}`, JSON.stringify({
                descricao: municipio.descricao,
                medias: municipio.medias
            }));
        };

        const salvarDescricao = () => {
            salvarDadosLocais();
            alert('Descrição salva com sucesso!');
        };

        const adicionarMidia = (media) => {
            municipio.medias.push(media);
            salvarDadosLocais();
        };

        const removerMidia = (index) => {
            municipio.medias.splice(index, 1);
            salvarDadosLocais();
        };

        return {
            codigoIbge,
            municipio,
            municipioCarregado,
            carregarMunicipio,
            salvarDescricao,
            adicionarMidia,
            removerMidia
        };
    }
}).mount('#app');