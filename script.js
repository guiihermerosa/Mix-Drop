async function obterAcessoToken() {
  const cliente_id = '7b2686f445ce42649ad99e0ecbd4ba41';
  const clienteSecret = '80d67f5561ff4882aaccce9cd1c2e827';

  const credentials = `${cliente_id}:${clienteSecret}`;
  const encodedCredentials = btoa(credentials);

  const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
          'Authorization': `Basic ${encodedCredentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

async function buscarArtistaPorNome(nome) {
  const token = await obterAcessoToken();

  const response = await fetch(`https://api.spotify.com/v1/search?q=${nome}&type=artist`, {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  });

  const data = await response.json();
  const artista = data.artists.items[0];
  
  if (artista) {
    document.getElementById('artistaNome').textContent = artista.name;
    
    document.getElementById('artistaSeguidores').textContent = artista.followers.total;
    document.getElementById('artistaImagem').src = artista.images[0] ? artista.images[0].url : '';
    document.getElementById('artistaImagem').style.display = artista.images[0] ? 'block' : 'none';
    
    await buscarMusicasMaisConhecidas(artista.id);
  } else {
    alert("Artista não encontrado.");
  }
}

async function buscarMusicasMaisConhecidas(artistaID) {
  const token = await obterAcessoToken();

  const response = await fetch(`https://api.spotify.com/v1/artists/${artistaID}/top-tracks?market=US`, {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  });

  const data = await response.json();
  const musicas = data.tracks;

  const listaMusicas = document.getElementById('listaMusicas');
  listaMusicas.innerHTML = ''; // Limpa a lista anterior

  musicas.forEach(musica => {
    const item = document.createElement('li');
    item.textContent = musica.name;

    const addButton = document.createElement('button');
    addButton.textContent = '+';
    addButton.addEventListener('click', () => {
      adicionarAosFavoritos(musica);
    });

    item.appendChild(addButton);
    listaMusicas.appendChild(item);
  });
}

let listaDeFavoritos = []; // Array para armazenar as músicas favoritas
let musicaAtualIndex = 0; // Índice da música atual na lista de favoritos
let player; // Referência global ao player do Spotify
let token = 'BQAYQzx6P1usSeNowQ2-inoQrO6drg8hiqXBesLyb0P481UAXAQDA_EchEjDU19JNm-C2jv5UNDV37cw_F2y4TF-A-9EWHbLygbXcjYytzUs0KRcD5pujHdd1f9LBiDRiitOClWxp6t7NxrsWYa-f89kqDLEp5-YNJwxou0cYTbEyMyRp5WGZeZtljr7w2fCCF6EuqDf6HKcI0-TP_b1Ysuriz_yiuJ0VJtn'; // Token de acesso (precisa ser atualizado com autenticação de usuário)

// Inicialize o SDK do Spotify
window.onSpotifyWebPlaybackSDKReady = () => {
    token = 'BQAYQzx6P1usSeNowQ2-inoQrO6drg8hiqXBesLyb0P481UAXAQDA_EchEjDU19JNm-C2jv5UNDV37cw_F2y4TF-A-9EWHbLygbXcjYytzUs0KRcD5pujHdd1f9LBiDRiitOClWxp6t7NxrsWYa-f89kqDLEp5-YNJwxou0cYTbEyMyRp5WGZeZtljr7w2fCCF6EuqDf6HKcI0-TP_b1Ysuriz_yiuJ0VJtn'; // Substitua pelo token do usuário autenticado (OAuth 2.0)

    player = new Spotify.Player({
        name: 'Web Playback SDK',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    // Conecte o player
    player.connect().then(success => {
        if (success) {
            console.log('Conectado com sucesso ao Spotify!');
        } else {
            console.error('Erro ao conectar com o player do Spotify');
        }
    });
};

function adicionarAosFavoritos(musica) {
  const listaFavoritos = document.getElementById('listaFavoritos');

  const item = document.createElement('li');
  item.textContent = musica.name;

  const editButton = document.createElement('button');
  editButton.textContent = 'Editar';
  editButton.addEventListener('click', () => {
      editarFavorito(item, musica);
  });

  const removeButton = document.createElement('button');
  removeButton.textContent = 'Remover';
  removeButton.addEventListener('click', () => {
      removerFavorito(item, musica);
  });

  const playButton = document.createElement('button');
  playButton.textContent = 'Tocar';
  playButton.addEventListener('click', () => {
    fetch(`https://api.spotify.com/v1/me/player/play`, {
      method: 'PUT',
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: [`spotify:track:${musica.id}`] })
  })
  });

  item.appendChild(editButton);
  item.appendChild(removeButton);
  item.appendChild(playButton);
  listaFavoritos.appendChild(item);
  listaDeFavoritos.push(musica); // Adiciona a música ao array de favoritos
}

function editarFavorito(item, musica) {
  const novoNome = prompt('Edite o nome da música:', musica.name);
  if (novoNome) {
    item.firstChild.textContent = novoNome;
  }
}

function removerFavorito(item, musica) {
  item.remove();
  listaDeFavoritos = listaDeFavoritos.filter(fav => fav.id !== musica.id); // Remove a música da lista
}

// Função para tocar a música atual da lista de favoritos
function tocarMusicaAtual() {
  if (listaDeFavoritos.length === 0) {
      alert("A lista de favoritos está vazia.");
      return;
  }

  const musica = listaDeFavoritos[musicaAtualIndex];
  fetch(`https://api.spotify.com/v1/me/player/play`, {
      method: 'PUT',
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: [`spotify:track:${musica.id}`] })
  }).then(() => {
      console.log('Tocando:', musica.name);
  }).catch(error => {
      console.error('Erro ao tocar a música:', error);
  });
}

// Botão de "Próxima"
document.getElementById('nextButton').addEventListener('click', () => {
  if (listaDeFavoritos.length === 0) {
      alert("A lista de favoritos está vazia.");
      return;
  }

  musicaAtualIndex = (musicaAtualIndex + 1) % listaDeFavoritos.length;
  tocarMusicaAtual();
});

// Botão de "Play/Pause"
document.getElementById('playButton').addEventListener('click', () => {
  if (player) {
      player.togglePlay().then(() => {
          console.log('Play/Pause acionado');
      });
  } else {
      alert("Player não inicializado.");
  }
});

document.getElementById('formArtista').addEventListener('submit', function(event) {
  event.preventDefault();
  const nomeArtista = document.getElementById('nomeArtista').value;
  buscarArtistaPorNome(nomeArtista);
});
