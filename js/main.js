"use strict";

window.onload = init;

let playbackInterval; // Variabel för uppspelningsintervall
let audioElement; // Element för ljuduppspelning
let elapsedTime = 0; // Variabel för att spåra hur mycket tid som passerat
let isPlaying = false; // Boolean som visar om ljudet spelas upp eller inte


function init() {
    addTitleAndSubtitle(); // Lägger till rubrik och undertext
    getChannel(); // Hämtar kanaler
    getNewsEpisodes(); // Hämtar nyheter
    getTrafficAreas(); // Hämtar trafikinfo
    getDocumentaries(); // Hämtar dokumentär

    // Event listener för hantering av ändringar i antal kanaler som visas
    const numrowsEl = document.getElementById("numrows");
    numrowsEl.addEventListener('change', () => {
        const maxRows = parseInt(numrowsEl.value);
        if (maxRows < 1) {
            numrowsEl.value = 1;
            alert("Minst en kanal måste visas.");
        } else {
            updateChannelList(); // Anropar uppdatering om värdet är giltigt
        }
    }, false);

    const playButton = document.getElementById("playbutton");
    if (playButton) {
        playButton.addEventListener("click", function () {
            const channelId = document.getElementById("playchannel").value; // Hämta valt kanal-ID från dropdown
            if (channelId) {
                playChannel(channelId); // Anropa playChannel med valt kanal-ID
            }
        });
    }

    function updateChannelList() {
        getChannel(); // Anropar funktionen för att hämta kanaler igen
    }

    async function getDocumentaries() {
        const url = "https://api.sr.se/api/v2/episodes/group?id=23037&format=json";
        const response = await fetch(url);
        const data = await response.json(); // Omvandla svaret till JSON

        populateDocumentarySelect(data.episodegroup.episodes); // Fyll rullista med dokumentärer
    }

    function populateDocumentarySelect(episodes) {
        const documentarySelect = document.createElement("select");
        documentarySelect.id = "documentary-select";
        documentarySelect.innerHTML = `<option value="">Dokumentärer om kända kriminalfall</option>`;

        episodes.forEach(episode => {
            const option = document.createElement("option");
            option.value = episode.id;
            option.textContent = episode.title;
            documentarySelect.appendChild(option); // Lägg till dokumentär som val
        });

        const channelSelectContainer = document.getElementById("playchannel").parentNode;
        channelSelectContainer.appendChild(documentarySelect); // Lägg till dokumentär-meny på sidan

        // Hantera val av dokumentär och visa avsnittsinfo
        documentarySelect.addEventListener("change", () => {
            const selectedEpisodeId = documentarySelect.value;
            if (selectedEpisodeId) {
                displayEpisodeInfo(selectedEpisodeId, episodes); // Visa avsnittsinfo
            } else {
                const infoDiv = document.getElementById("info");
                infoDiv.innerHTML = ""; // Rensa info om inget avsnitt är valt
            }
        });

        const playDocumentaryButton = document.createElement("button");
        playDocumentaryButton.textContent = "Spela upp dokumentär";
        // Stil för spela-knappen dokumentär (eftersom vi inte får korrigera css-filen)
        playDocumentaryButton.style.display = "inline-block";
        playDocumentaryButton.style.height = "35px";
        playDocumentaryButton.style.lineHeight = "35px";
        playDocumentaryButton.style.padding = "0 1em 0 1em";
        playDocumentaryButton.style.fontWeight = "400";
        playDocumentaryButton.style.textAlign = "center";
        playDocumentaryButton.style.whiteSpace = "nowrap";
        playDocumentaryButton.style.cursor = "pointer";
        playDocumentaryButton.style.userSelect = "none";
        playDocumentaryButton.style.borderRadius = ".25rem";
        playDocumentaryButton.style.border = "0";
        playDocumentaryButton.style.textDecoration = "none";
        playDocumentaryButton.style.color = "#fff";
        playDocumentaryButton.style.backgroundColor = "#D07E00";
        playDocumentaryButton.addEventListener("click", () => {
            const selectedEpisodeId = documentarySelect.value;
            if (selectedEpisodeId) {
                playEpisode(selectedEpisodeId); // Spela upp vald dokumentär
            } else {
                alert("Vänligen välj en dokumentär först.");
            }
        });

        channelSelectContainer.appendChild(playDocumentaryButton); // Lägg till spel-knappen på sidan
    }

    function displayEpisodeInfo(selectedEpisodeId, episodes) {
        const infoDiv = document.getElementById("info");
        infoDiv.innerHTML = "";

        const episode = episodes.find(ep => ep.id == selectedEpisodeId);
        if (episode) {
            const title = document.createElement("h3");
            title.textContent = episode.title;

            const description = document.createElement("p");
            description.textContent = episode.description;

            infoDiv.appendChild(title); // Lägg till titeln i infodiven
            infoDiv.appendChild(description); // Lägg till beskrivningen i infodiven
        }
    }

    function playEpisode(episodeId) {
        const url = `https://api.sr.se/api/v2/episodes/${episodeId}?format=json`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log("Avsnittsdata:", data.episode);
                if (data.episode) {
                    // Hämta ljud-URL
                    const audioUrl = data.episode.listenpodfile?.url || data.episode.downloadpodfile?.url;

                    if (audioUrl) {
                        playAudio(audioUrl); // Spela upp ljudfilen
                    } else {
                        console.error("Ingen ljud-URL tillgänglig!");
                    }
                } else {
                    console.error("Ingen avsnitt hittades för ID:", episodeId);
                }
            })
            .catch(error => {
                console.error("Fel vid hämtning avsnitt:", error);
            });
    }


    function playAudio(audioUrl) {
        if (audioUrl) {
            if (audioElement) {
                if (isPlaying) {
                    audioElement.pause(); // Pausa om den redan spelas
                    isPlaying = false;
                    return; // Avsluta funktionen
                } else {
                    audioElement.pause(); // Pausa det som spelas
                    audioElement.src = audioUrl; // Sätt ny ljudkälla
                }
            } else {
                audioElement = document.createElement("audio"); // Skapa nytt audio-element
                audioElement.controls = true; // Lägg till kontroller för att göra det synligt
                audioElement.src = audioUrl; // Sätt ljudkällan
                document.getElementById("radioplayer").appendChild(audioElement); // Placera ljudspelaren i den ljusgrå rutan
            }
            audioElement.play();
            isPlaying = true;
        } else {
            console.error("Ingen ljud-URL tillgänglig!");
        }
    }

    // Funktion för att hämta trafikområden
    async function getTrafficAreas() {
        const url = "https://api.sr.se/api/v2/traffic/areas?format=json";
        const response = await fetch(url);
        const data = await response.json();

        // Fyll i dropdown.meny med trafikområden
        populateTrafficAreaSelect(data); // Fyll i rullista med trafikområden
    }


    // Funktion för att skapa och fylla rullista-meny för trafikområden
    function populateTrafficAreaSelect(data) {
        const trafficSelect = document.createElement("select");
        trafficSelect.id = "traffic-area";
        trafficSelect.innerHTML = `<option value="">Trafikinfo - välj område</option>`;

        data.areas.forEach(area => {
            const option = document.createElement("option");
            option.value = area.name;
            option.textContent = area.name;
            trafficSelect.appendChild(option); // Lägg till område i select-elementet
        });

        // Lägg till en eventlyssnare för att fånga när användaren väljer ett område
        trafficSelect.addEventListener("change", () => {
            const selectedAreaName = trafficSelect.value;
            if (selectedAreaName) {
                getTrafficInfo(selectedAreaName); // Hämta trafikinfo för valt område
            }
        });

        // Hämta containern för kanalsektorn och lägg till de nya traikområdesvalen överst
        const channelSelectContainer = document.getElementById("playchannel").parentNode;
        channelSelectContainer.insertBefore(trafficSelect, channelSelectContainer.firstChild);
    }

    // Funktion för att hämta trafikmeddelanden baserat på valt område
    async function getTrafficInfo(areaName) {
        const infoDiv = document.getElementById("info");
        infoDiv.innerHTML = "";

        const url = `https://api.sr.se/api/v2/traffic/messages?trafficareaname=${encodeURIComponent(areaName)}&format=json`;
        const response = await fetch(url);
        const data = await response.json();

        displayTrafficInfo(data); // Visa trafikinformationen i info-diven
    }

    function displayTrafficInfo(data) {
        const infoDiv = document.getElementById("info");
        infoDiv.innerHTML = "";

        if (data.messages && data.messages.length > 0) {
            data.messages.forEach(message => {
                const messageElement = document.createElement("article");

                const title = document.createElement("h3");
                title.textContent = message.title || "Trafikmeddelande";
                messageElement.appendChild(title);

                const description = document.createElement("p");
                description.textContent = message.description || "Ingen ytterligare information.";
                messageElement.appendChild(description);

                infoDiv.appendChild(messageElement);
            });
        } else {
            const noInfo = document.createElement("p");
            noInfo.textContent = "Ingen trafikinfo tillgänglig för det valda området.";
            infoDiv.appendChild(noInfo);
        }
    }

    // Funktion för att lägga till rubrik och undertext
    function addTitleAndSubtitle() {
        const title = document.createElement("h1");
        title.textContent = "Välkommen till tablåer för Sveriges radio";

        const subtitle = document.createElement("p");
        subtitle.textContent = "Denna webb-applikation använder Sveriges Radios öppna API för tablåer. Välj kanal till vänster för att visa tablå för denna kanal.";

        const infoContainer = document.getElementById("info");

        // Lägg till rubrik och undertext i containern
        infoContainer.appendChild(title);
        infoContainer.appendChild(subtitle);
    }

    // Hämta data från webbtjänst
    async function getChannel() {
        const url = "https://api.sr.se/api/v2/channels?format=json";
        const maxChannels = parseInt(document.getElementById("numrows").value) || 10;

        let allChannels = [];
        let currentPage = 1;

        // Hämtar kanaler
        while (true) {
            const response = await fetch(`${url}&page=${currentPage}`);
            const data = await response.json();

            // Lägg till kanaler i lista
            allChannels = allChannels.concat(data.channels);

            // Om det inte finns fler kanaler, bryt loopen
            if (data.pagination.totalhits <= allChannels.length) break;

            currentPage++; // Gå till nästa sida
        }

        displayChannel({ channels: allChannels }, maxChannels); // Visa kanaler i vänsterspalten

        // Skapa och placera rutan för att välja antal kanaler under kanallistan
        const numRowsInput = document.getElementById("numrows");
        const channelList = document.getElementById("mainnavlist");
        const numRowsLabel = document.querySelector('label[for="numrows"]');

        // Skapa en wrapper för label och input
        const numRowsContainer = document.createElement('div');
        numRowsContainer.classList.add('num-rows-container');
        numRowsContainer.appendChild(numRowsLabel);
        numRowsContainer.appendChild(numRowsInput);

        // Infoga wrapper efter kanallistan
        channelList.insertAdjacentElement("afterend", numRowsContainer);

        populateChannelSelect({ channels: allChannels }); // Fyll i kanalval övre högra hörn
    }

    function populateChannelSelect(data) {
        const channelSelect = document.getElementById("playchannel");
        channelSelect.innerHTML = "";

        data.channels.forEach(channel => {
            const option = document.createElement("option");
            option.value = channel.id; // Använd kanalens ID som värde
            option.textContent = channel.name; // Visa kanalens namn
            channelSelect.appendChild(option);
        });
    }

    async function getNewsEpisodes() {
        const url = "http://api.sr.se/api/v2/news/episodes?format=json";
        const response = await fetch(url);
        const data = await response.json();

        // Skapa ett nytt element som ska innehålla nyhetsprogrammen
        const newsContainer = document.createElement("div");
        newsContainer.id = "news-container"; // Ge det nya elementet ett ID
        newsContainer.style.marginTop = "20px"; // Marginal för avstånd

        // Skapa rubrik för nyhetsprogrammen
        const newsTitle = document.createElement("h2");
        newsTitle.textContent = "Nyhetsprogram";
        newsTitle.style.fontSize = "24px";
        newsContainer.appendChild(newsTitle); // Lägg till rubriken i nyhetscontainern

        // Hitta kanallistan och placera nyhetscontainern precis efter den
        const channelList = document.getElementById("mainnavlist");
        channelList.insertAdjacentElement("afterend", newsContainer);

        const articles = data.episodes.map(createNewsArticle);

        // Lägg till varje artikel till nyhetscontainern
        articles.forEach(article => newsContainer.appendChild(article));
    }


    function createNewsArticle(news) {
        const article = document.createElement("article");

        const programLink = document.createElement("a");
        programLink.href = news.url; // Länk till nyhetsprogrammet
        programLink.textContent = news.title; // Namn på nyhetsprogrammet
        programLink.target = "_blank"; // Öppna länk i en ny flik
        programLink.style.textDecoration = 'none';
        programLink.style.color = '#337ab7';
        programLink.style.fontSize = "0.825em";
        programLink.style.paddingLeft = "1.5em";


        article.appendChild(programLink);
        return article; // Returnera artikel-elementet
    }


    // Visa information om en specifik kanal
    function displayChannel(data, maxChannels) {
        // Hitta kanalen som ska visas
        const channelList = document.getElementById("mainnavlist");
        channelList.innerHTML = "";

        // Loopa genom kanalerna och lägg till de i listan
        data.channels.slice(0, maxChannels).forEach(channel => {
            const listItem = createChannelListItem(channel);
            channelList.appendChild(listItem);
        });
    }

    function createChannelListItem(channel) {
        const listItem = document.createElement("li");
        listItem.textContent = channel.name;

        const hoverInfoDiv = createHoverInfoDiv(); // Skapa hover-info-div

        listItem.addEventListener("mouseenter", () => showHoverInfo(hoverInfoDiv, channel, listItem));
        listItem.addEventListener("mouseleave", () => hideHoverInfo(hoverInfoDiv));
        listItem.addEventListener("click", () => getSchedule(channel.id)); // Hämtar tablån vid klick på kanal

        return listItem;
    }

    function createHoverInfoDiv() {
        const hoverInfoDiv = document.createElement("div");
        hoverInfoDiv.classList.add("hover-info");
        hoverInfoDiv.style.position = "absolute";
        hoverInfoDiv.style.display = "none"; // Dölj från början
        hoverInfoDiv.style.fontSize = "12px";
        hoverInfoDiv.style.maxWidth = "150px";
        hoverInfoDiv.style.backgroundColor = "white"; // Vit bakgrund
        hoverInfoDiv.style.border = "1px solid #ccc"; // Liten inramning
        hoverInfoDiv.style.zIndex = "1000"; // Se till att den är över andra element
        document.body.appendChild(hoverInfoDiv); // Lägger till hover-div i dokumentet

        return hoverInfoDiv;
    }

    function hideHoverInfo(hoverInfoDiv) {
        hoverInfoDiv.style.display = "none";
    }


    function showHoverInfo(hoverInfoDiv, channel, listItem) {
        hoverInfoDiv.textContent = channel.tagline || "Beskrivning saknas";
        const listItemRect = listItem.getBoundingClientRect();
        hoverInfoDiv.style.left = `${listItemRect.right + 10}px`; // Positionera hover-div till höger om listitem
        hoverInfoDiv.style.top = `${listItemRect.top}px`;
        hoverInfoDiv.style.display = "block"; // Visa hover-info-div
    }

    // Hämta och visa tablå för varje kanal
    async function getSchedule(channelId) {
        const maxRows = document.getElementById("numrows").value || 10; // Hämta max antal från inputfältet
        let allPrograms = [];
        let currentPage = 1;

        // Hämta tills inga fler program finns
        while (true) {
            const url = `https://api.sr.se/api/v2/scheduledepisodes?channelid=${channelId}&format=json&maxresults=${maxRows}&page=${currentPage}`;

            const response = await fetch(url);
            const data = await response.json();

            // Om inga program returneras, bryt loopen
            if (!data.schedule || data.schedule.length === 0) break;

            allPrograms = allPrograms.concat(data.schedule); // Lägger till programmen i lista
            currentPage++;
        }

        // Visa alla program
        displaySchedule(allPrograms);
    }

    // Visa programinformation
    function displaySchedule(programs) {
        const infoDiv = document.getElementById("info");
        infoDiv.innerHTML = "";

        const currentTime = new Date(); // Hämta aktuell tid

        programs.forEach(program => {
            const startTime = new Date(parseInt(program.starttimeutc.substr(6))); // Omvandla starttid till ett Date-objekt

            if (startTime >= currentTime) { // Kontrollera om programmet börjar nu eller senare
                const article = createProgramArticle(program);
                infoDiv.appendChild(article); // Lägg till artikeln i info-diven
            }
        });
    }


    function createProgramArticle(program) {
        const article = document.createElement("article");

        const title = document.createElement("h3");
        title.textContent = program.title;
        article.appendChild(title);

        const subtitle = document.createElement("h4");
        subtitle.textContent = program.subtitle || " "; // Lägg till programsubtitle eller tom sträng om inget finns
        article.appendChild(subtitle);

        // Hämta start- och sluttider
        const time = createProgramTime(program);
        article.appendChild(time); // Lägg till tidsinfo i artikeln

        const description = document.createElement("p");
        description.textContent = program.description || " "; // Lägg till programbeskrivning eller tom sträng om inget finns
        article.appendChild(description);

        return article; // Returnera det färdiga artikel-elementet
    }

    function createProgramTime(program) {
        const time = document.createElement("h5");
        const timeText = formatProgramTime(program.starttimeutc, program.endtimeutc);
        time.textContent = timeText; // Lägg till programtider
        return time; // Returnera tidselementet
    }

    function formatProgramTime(startTimeStr, endTimeStr) {
        let timeText = '';

        if (startTimeStr) {
            const startTime = new Date(parseInt(startTimeStr.substr(6))); //Omvandla starttid till ett Date-objekt
            timeText += formatTime(startTime); // Lägg till formaterad starttid
        } else {
            timeText += "Starttid saknas.";
        }

        if (endTimeStr) {
            const endTime = new Date(parseInt(endTimeStr.substr(6))); //Omvandla sluttid
            timeText += ` - ${formatTime(endTime)}`; // Lägg till formaterad sluttid
        } else {
            timeText += " - Sluttid saknas.";
        }

        return timeText; // Returnera formaterad tidssträngen
    }

    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format för tid
    }
}
async function playChannel(channelId) {
    try {
        const response = await fetch(`https://api.sr.se/api/v2/channels/${channelId}?format=json`);
        const data = await response.json();

        if (data.channel && data.channel.liveaudio && data.channel.liveaudio.url) { // Kontrollera att ljudströmmen finns
            const liveAudioUrl = data.channel.liveaudio.url;

            if (!audioElement) { // Om ljudspelare inte finns, skapa en ny
                audioElement = new Audio(liveAudioUrl); // Skapa nytt Audio-objekt
                audioElement.controls = true; // Lägg till kontroller för uppspelning
                const playerContainer = document.getElementById("radioplayer");
                playerContainer.appendChild(audioElement); // Lägg till ljudspelaren i containern
            } else if (audioElement.src !== liveAudioUrl) {
                audioElement.src = liveAudioUrl; // Om kanalen ändras, uppdatera ljudström
            }

            if (isPlaying) {
                audioElement.pause(); // Pausa om det redan spelas
                clearInterval(playbackInterval); // Stoppa timer för uppspelning
            } else {
                audioElement.play(); // Spela upp om det är pausat
                startPlaybackTimer(); // Starta timer för uppspelning
            }

            isPlaying = !isPlaying; // Växla uppspelningstillstånd
        } else {
            console.error("Ingen ljudström tillgänglig för denna kanal.");
        }
    } catch (error) {
        console.error("Fel vid hämtning av kanalens ljudström:", error);
    }
}

function startPlaybackTimer() {
    elapsedTime = 0; // Nollställ tiden vid ny uppspelning
    playbackInterval = setInterval(() => {
        elapsedTime += 1; // Öka spelad tid med 1 sekund
        updateDurationDisplay(); // Uppdatera display
    }, 1000);

    audioElement.addEventListener('ended', () => {
        clearInterval(playbackInterval);
        elapsedTime = 0; // Nollställ tiden när ljudet har slutat
        updateDurationDisplay(); // Rensa display
    });
}

function updateDurationDisplay() {
    const playerContainer = document.getElementById("radioplayer");
    let durationDisplay = playerContainer.querySelector(".duration-display"); // Hämta elementet som visar uppspelningstiden
}