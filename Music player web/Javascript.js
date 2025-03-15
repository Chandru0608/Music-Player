document.addEventListener("DOMContentLoaded", () => {
    const audio = document.getElementById("audio");
    const playPauseButton = document.getElementById("play-pause");
    const prevButton = document.getElementById("prev");
    const nextButton = document.getElementById("next");
    const seekBar = document.getElementById("seek-bar");
    const startTimeDisplay = document.getElementById("start-time");
    const endTimeDisplay = document.getElementById("end-time");
    const volumeIcon = document.getElementById("volume-icon");
    const volumeControl = document.getElementById("volume");
    const songList = document.getElementById("song-list");
    const currentSongDisplay = document.getElementById("current-song");
    const currentSongDetails = document.getElementById("current-song-details");
    const currentSongImage = document.getElementById("current-song-image");
    const playlistOptions = document.getElementById("playlist-options");
    const playlistMenu = document.getElementById("playlist-menu");
    const addSongButton = document.getElementById("add-song");
    const deleteSongButton = document.getElementById("delete-song");
    let songs = Array.from(songList.children);
    let currentSongIndex = 0;

    if (!audio || !playPauseButton || !prevButton || !nextButton || !seekBar || !volumeControl || !songList) {
        console.error("Some elements are missing from the DOM!");
        return;
    }

    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    }

    function loadSong(index) {
        if (songs.length > 0) {
            currentSongIndex = index;
            audio.src = songs[index].dataset.src;
            currentSongDisplay.textContent = truncateText(songs[index].textContent, 90);
            currentSongDetails.textContent = songs[index].dataset.details || "Unknown Artist - Unknown Album";
            currentSongImage.src = songs[index].dataset.image || "Images/default.jpg";
            audio.load();

            audio.play().then(() => {
                updatePlayPauseIcon();
            }).catch((error) => {
                console.warn("Playback was prevented by the browser:", error);
            });

            updatePlayPauseIcon();
        }
    }

    function updatePlayPauseIcon() {
        if (audio.paused) {
            playPauseButton.classList.remove("fa-circle-pause");
            playPauseButton.classList.add("fa-circle-play");
        } else {
            playPauseButton.classList.remove("fa-circle-play");
            playPauseButton.classList.add("fa-circle-pause");
        }
    }

    playPauseButton.addEventListener("click", () => {
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
        updatePlayPauseIcon();
    });

    prevButton.addEventListener("click", () => {
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        loadSong(currentSongIndex);
    });

    nextButton.addEventListener("click", () => {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        loadSong(currentSongIndex);
    });

    function formatTime(seconds) {
        let minutes = Math.floor(seconds / 60);
        let secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    }

    audio.addEventListener("timeupdate", () => {
        if (!isNaN(audio.duration) && audio.duration > 0) {
            seekBar.value = (audio.currentTime / audio.duration) * 100;
            startTimeDisplay.textContent = formatTime(audio.currentTime);
        }
    });

    audio.addEventListener("loadedmetadata", () => {
        console.log("Audio Duration:", audio.duration);
        if (!isNaN(audio.duration)) {
            endTimeDisplay.textContent = formatTime(audio.duration);
        } 
        else {
            endTimeDisplay.textContent = "0:00";
        }
    });

    seekBar.addEventListener("change", () => {
        audio.currentTime = (seekBar.value / 100) * audio.duration;
    });

    volumeIcon.addEventListener("click", () => {
        volumeControl.style.display = volumeControl.style.display === "block" ? "none" : "block";
    });

    volumeControl.addEventListener("input", () => {
        audio.volume = volumeControl.value;
    });

    function updateSongClickListeners() {
        songs = Array.from(songList.children);
        songs.forEach((song, index) => {
            song.textContent = truncateText(song.textContent, 90);
            song.addEventListener("click", () => {
                loadSong(index);
            });
        });
    }

    updateSongClickListeners();

    playlistOptions.addEventListener("click", () => {
        playlistMenu.classList.toggle("hidden");
    });

    function hideMenu() {
        playlistMenu.classList.add("hidden");
    }

    async function fetchMetadata(file) {
        return new Promise((resolve) => {
            jsmediatags.read(file, {
                onSuccess: (tag) => {
                    const artist = tag.tags.artist || "Unknown Artist";
                    const album = tag.tags.album || "Unknown Album";
                    let image = "Images/default.jpg";
                    if (tag.tags.picture) {
                        let base64String = "";
                        for (let i = 0; i < tag.tags.picture.data.length; i++) {
                            base64String += String.fromCharCode(tag.tags.picture.data[i]);
                        }
                        image = `data:${tag.tags.picture.format};base64,${btoa(base64String)}`;
                    }
                    resolve({ details: `${artist} - ${album}`, image });
                },
                onError: () => {
                    resolve({ details: "Unknown Artist - Unknown Album", image: "Images/default.jpg" });
                }
            });
        });
    }

    addSongButton.addEventListener("click", () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "audio/*";
        fileInput.addEventListener("change", async (event) => {
            const file = event.target.files[0];
            if (file) {
                const existingSongs = Array.from(songList.children).map(song => song.dataset.src);
                if (existingSongs.includes(URL.createObjectURL(file))) {
                    alert("Song already exists in the playlist.");
                    return;
                }

                const metadata = await fetchMetadata(file);
                const newSong = document.createElement("li");
                newSong.textContent = truncateText(file.name, 90);
                newSong.dataset.src = URL.createObjectURL(file);
                newSong.dataset.details = metadata.details;
                newSong.dataset.image = metadata.image;
                songList.appendChild(newSong);
                updateSongClickListeners();
                loadSong(songs.length - 1);
            }
        });
        fileInput.click();
        hideMenu();
    });

    deleteSongButton.addEventListener("click", () => {
        const songItems = Array.from(songList.children);
        if (songItems.length === 0) {
            alert("No songs available to delete.");
            return;
        }
        
        const songToDelete = prompt("Select the song number to delete:\n" + songItems.map((song, index) => `${index + 1}: ${song.textContent}`).join("\n"));
        
        const songIndex = parseInt(songToDelete, 10) - 1;
        if (!isNaN(songIndex) && songIndex >= 0 && songIndex < songItems.length) {
            songList.removeChild(songItems[songIndex]);
            updateSongClickListeners();
            songs = Array.from(songList.children);
            if (currentSongIndex === songIndex && songs.length > 0) {
                loadSong(0);
            }
        } else {
            alert("Invalid selection.");
        }
        hideMenu();
    });

    audio.addEventListener("play", updatePlayPauseIcon);
    audio.addEventListener("pause", updatePlayPauseIcon);
});