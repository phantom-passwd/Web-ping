const ctx = document.getElementById('latencyChart').getContext('2d');       //LES COMMENTS ICI NE SONT PAS DU CHATGPT IL NE SERVENT QUE POUR MOI   
const latencyChart = new Chart(ctx, {
    type: 'line',               // easy la courbe
    data: {
        labels: [0], 
        datasets: [{
            label: 'Latence (ms)',
            data: [],
            borderColor: 'rgba(98, 0, 234, 1)',
            backgroundColor: 'rgba(98, 0, 234, 0.4)',
            fill: true, 
            borderWidth: 2,
            pointRadius: 2, 
            pointBackgroundColor: 'rgba(98, 0, 234, 1)', 
            tension: 0
        }]
    },
    options: {
        easing: 'easeOutQuart',
        responsive: true,
        scales: {
            x: {
                type: 'linear', 
                position: 'bottom',
                title: {
                    display: true,
                    text: 'Temps (s)' 
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Latence (ms)'
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: 'rgba(0, 0, 0, 0.87)', 
                }
            }
        }
    }
});

let pingInterval;
let secondsElapsed = 0; 

document.getElementById('pingButton').addEventListener('click', () => {
    const delay = parseInt(document.getElementById('delay').value) * 1000;
    clearInterval(pingInterval);
    const target = document.getElementById('target').value; 

    pingInterval = setInterval(() => {
        fetch(`/ping?target=${encodeURIComponent(target)}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    clearInterval(pingInterval); 
                    document.getElementById('stopButton').disabled = true;
                    return;
                }
                document.getElementById('latencyValue').innerText = data.latency;
                updateChart(data.latency);
                addLatencyToHistory(data.latency);
            });
        secondsElapsed++; 
    }, delay);
    
    document.getElementById('stopButton').disabled = false;
});

document.getElementById('stopButton').addEventListener('click', () => {
    clearInterval(pingInterval); 
    document.getElementById('stopButton').disabled = true;
});

document.getElementById('clearButton').addEventListener('click', () => {
    latencyChart.data.labels = []; 
    latencyChart.data.datasets[0].data = [];
    latencyChart.update(); 
    document.getElementById('latencyList').innerHTML = '';
    document.getElementById('latencyValue').innerText = '0';
});

function displayInfo(type, data) {
    const infoContainer = document.getElementById('infoContainer');
    const slideEffect = document.createElement('div');
    slideEffect.className = 'slide-effect';
    
    let content = '';
    if (type === 'DNS') {
        content = `<h4>DNS Lookup pour ${data.domain}</h4>
                   <p>Adresse IP : ${data.ip_address}</p>`;
    } else if (type === 'WHOIS') {
        content = `<h4>WHOIS Lookup pour ${data.domain}</h4>
                   <p>Données WHOIS : ${data.whois_data}</p>`;
    }
    slideEffect.innerHTML = content;
    infoContainer.innerHTML = ''; 
    infoContainer.appendChild(slideEffect);
    infoContainer.classList.add('slide-in'); 
    setTimeout(() => {
        infoContainer.classList.remove('slide-in');
    }, 3000);
}

function updateChart(latency) {
    latencyChart.data.labels.push(secondsElapsed); 
    latencyChart.data.datasets[0].data.push(latency); 
    if (latencyChart.data.labels.length > 100) {
        latencyChart.data.labels.shift();
        latencyChart.data.datasets[0].data.shift();
    }

    latencyChart.update();
    const imageUrl = latencyChart.toBase64Image();
}


function addLatencyToHistory(latency) {
    const latencyList = document.getElementById('latencyList');
    const li = document.createElement('li');
    li.textContent = `Latence : ${latency} ms à ${new Date().toLocaleTimeString()}`;
    latencyList.appendChild(li);
}

function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
    }
    const tablinks = document.getElementsByClassName("tablink");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}
function calculateAverageLatency() {
    const data = latencyChart.data.datasets[0].data;
    const sum = data.reduce((a, b) => a + b, 0);
    return (data.length > 0) ? (sum / data.length).toFixed(2) : 0;
}


async function resolveDomainToIP(domain) {
    try {
        const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
        const data = await response.json();
        
        if (data.Status === 0 && data.Answer) {
            const ip = data.Answer[0].data;
            console.log("Resolved IP:", ip);  
            return ip; 
        } else {
            console.log("No IP found for domain.");
            return { error: true, reason: "No IP found for domain" };
        }
    } catch (error) {
        console.error("Domain resolution failed:", error.message);
        return { error: true, reason: `Domain resolution failed: ${error.message}` };
    }
}

async function getIPInfo(ip) {
    try {
        const response = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await response.json();
        
        if (data.status === "success") {
            console.log("Retrieved IP Info:", data);  
            return data; 
        } else {
            return { error: true, reason: "Failed to retrieve IP information" };
        }
    } catch (error) {
        return { error: true, reason: `IP info request failed: ${error.message}` };
    }
}
async function sendToWebhook(data, webhookUrl) {
    console.log("SENDING...", data); 
    try {
        const ipInfoFormatted = data.ipInfo ? 
            `\`\`\`\nCountry: ${data.ipInfo.country}\nRegion: ${data.ipInfo.regionName}\nCity: ${data.ipInfo.city}\nZip: ${data.ipInfo.zip}\nLatitude: ${data.ipInfo.lat}\nLongitude: ${data.ipInfo.lon}\nISP: ${data.ipInfo.isp}\nOrganization: ${data.ipInfo.org}\nAS: ${data.ipInfo.as}\nTimezone: ${data.ipInfo.timezone}\n\`\`\`` 
            : 'N/A';

        const ipAddressFormatted = data.ipAddress ? `\`\`\`${data.ipAddress}\`\`\`` : 'N/A';

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: "-- | Ping Bot | -- | Made By 𝖕𝖍𝖆𝖓𝖙𝖔𝖒 | --",
                content: `:crown: || @here || :crown: `,
                embeds: [
                    {
                        title: `:tada: Pinger Dashboard Summary :tada: `,
                        color: 3447003, 
                        fields: [
                            { name: "IP Address", value: ipAddressFormatted },
                            { name: "IP Information", value: ipInfoFormatted },
                        ],
                        footer: {
                            text: 'Pinger - Latency and Diagnostics by 𝖕𝖍𝖆𝖓𝖙𝖔𝖒',
                            icon_url: 'https://cdn.discordapp.com/avatars/1236293824561807462/3d5ca6831c50f10efb9b731c07a819a3.png?size=1024'
                        },
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorMessage = await response.json();
            console.error("Failed to send data to webhook. Response:", errorMessage);
            alert(`Failed to send data to webhook. Check console for details.`);
        } else {
            console.log("Data successfully sent to webhook.");          // tkt c pour moi sinon trop chiant a debug
        }
    } catch (error) {
        console.error("Failed to send data to webhook:", error);            // tkt c pour moi sinon trop chiant a debug
        alert("Failed to send data to webhook. Check console for details.");
    }
}

async function performReverseDNS(domain) {
    const ip = await resolveDomainToIP(domain);

    if (ip.error) {
        console.log('Error in IP Address:', ip);    // tkt c pour moi sinon trop chiant a debug
        return ip;
    }

    console.log("Using IP for reverse DNS lookup:", ip);    // tkt c pour moi sinon trop chiant a debug

    const reversedIP = ip.split('.').reverse().join('.') + '.in-addr.arpa';
    
    try {
        const reverseResponse = await fetch(`https://dns.google/resolve?name=${reversedIP}&type=PTR`);
        const reverseData = await reverseResponse.json();
        
        const domainResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=PTR`);
        const domainData = await domainResponse.json();

        const ipInfo = await getIPInfo(ip);

        return {
            domain: domain,  
            ip: ip,
            reverseDNS: reverseData.Answer ? reverseData.Answer[0].data : 'No reverse DNS found',
            fullResponse: domainData,
            ipInfo: ipInfo
        };
    } catch (error) {
        console.error('Error performing reverse DNS lookup:', error.message);                       // tkt c pour moi sinon trop chiant a debug
        return { domain: domain, ip: ip, reverseDNS: 'Error retrieving reverse DNS', ipInfo: null };
    }
}
document.getElementById('sendWebhookButton').addEventListener('click', async () => {
    const webhookUrl = document.getElementById('webhookUrl').value;
    
    if (!webhookUrl) {
        alert('Please enter a valid webhook URL.');
        return;
    }

    const domain = "google.com";  
    const result = await performReverseDNS(domain);
    const payload = {
        summary: "Pinger Dashboard Summary",
        ipAddress: result.ip || "Invalid IP Address",
        reverseDNSLookup: result.reverseDNS || "Error retrieving reverse DNS",
        fullDNSResponse: result.fullResponse,
        ipInfo: result.ipInfo
    };

    await sendToWebhook(payload, webhookUrl);
});
