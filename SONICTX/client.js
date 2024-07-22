(async function () {
    const MODULE_NAME = "SONICTX";
    const socket = io('http://127.0.0.1:9514/', { secure: true });

    const setStorage = async (key, value) => {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'Timeout: A operação demorou mais de 10 segundos.' });
            }, 10000);

            socket.on(`storage.store.res.${MODULE_NAME}.${window.identifier}.${key}`, (data) => {
                clearTimeout(timeout);
                resolve(data);
            });

            socket.emit('storage.store', {
                extension: MODULE_NAME,
                id: window.identifier,
                key,
                value,
                response: `storage.store.res.${MODULE_NAME}.${window.identifier}.${key}`
            });
        });
    };

    const getStorage = async (key) => {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'Timeout: A operação demorou mais de 10 segundos.' });
            }, 10000);

            socket.on(`storage.load.res.${MODULE_NAME}.${window.identifier}.${key}`, (data) => {
                clearTimeout(timeout);
                if (data.success) {
                    resolve(data);
                } else {
                    resolve({ success: false, error: 'Erro ao carregar o armazenamento' });
                }
            });

            socket.emit('storage.load', {
                extension: MODULE_NAME,
                id: window.identifier,
                key,
                response: `storage.load.res.${MODULE_NAME}.${window.identifier}.${key}`
            });
        });
    };

    const getVariable = async (variableName, defaultValue, create = false) => {
        const data = await getStorage(variableName);
        if (!data.success && create) {
            await setStorage(variableName, defaultValue);
            return defaultValue;
        } else if (data.success) {
            return data.value;
        } else {
            return defaultValue;
        }
    };

    // Função para realizar auto click no objeto 'temp1' 100 vezes
    function autoClick(objeto, repeatTimes, intervalTime) {
        let count = 0;

        // Função para executar o clique
        function doClick() {
            if (count < repeatTimes) {
                objeto.click(); // Emitir o sinal de clique no objeto
                count++;
                updateCounter(count); // Atualizar contador na página
                // Se ainda não atingiu o número máximo de repetições, agendar o próximo clique
                if (count < repeatTimes) {
                    setTimeout(doClick, intervalTime);
                }
            }
        }

        // Chamar a função para começar os cliques
        doClick();
    }

    // Função para obter o elemento 'temp1' pelo XPath
    function getElementByXPath(xpath) {
        return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    // Função para atualizar o contador na página
    function updateCounter(count) {
        const counterElement = document.getElementById('click-counter');
        if (counterElement) {
            counterElement.textContent = `Cliques realizados: ${count}`;
        }
    }

    // Função para exibir Swal Fire ao pressionar Control+Alt+K
    function handleKeyPress(event) {
        if (event.ctrlKey && event.altKey && event.key === 'k') {
            Swal.fire({
                title: 'Configurar Cliques Automáticos',
                html:
                    '<label for="repeatTimes">Número de Cliques:</label>' +
                    '<input type="number" id="repeatTimes" value="5" class="swal2-input" min="1">' +
                    '<label for="intervalTime">Intervalo entre Cliques (ms):</label>' +
                    '<input type="number" id="intervalTime" value="20000" class="swal2-input" min="1000">',
                focusConfirm: false,
                preConfirm: () => {
                    const repeatTimes = Swal.getPopup().querySelector('#repeatTimes').value;
                    const intervalTime = Swal.getPopup().querySelector('#intervalTime').value;
                    const temp1 = getElementByXPath('//*[@id="board"]/div[1]/button');
                    if (temp1) {
                        autoClick(temp1, repeatTimes, intervalTime); // Chama autoClick com os valores inseridos
                    } else {
                        console.error('Elemento temp1 não encontrado.');
                    }
                }
            }).then(() => {
                const repeatTimes = Swal.getPopup().querySelector('#repeatTimes').value;
                const intervalTime = Swal.getPopup().querySelector('#intervalTime').value;
                console.log('Configurações:', repeatTimes, intervalTime);
            });
        }
    }

    // Adicionar event listener para capturar a combinação de teclas
    document.addEventListener('keydown', handleKeyPress);

    socket.on('connect', () => {
        console.log('Connected to WebSocket server');

        socket.on(`${MODULE_NAME}:event`, (data) => {
            console.log('Received event:', data);
        });
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
    });
})();
