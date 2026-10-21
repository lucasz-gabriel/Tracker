
const canvas = document.getElementById('grafico-evolucao');

const grafico = new Chart(canvas, {
    type: 'line',

    data: {
        labels: ['01/10', '05/10', '10/10', '15/10', '20/10', '25/10', '31/10'],

        datasets: [{
            label: 'Saldo',
            data: [1000, 850, 1200, 950, 1400, 1250, 1600],
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            fill: true,
            tension: 0.4
        }]
    },

    options: {
        responsive: true,
        maintainAspectRatio: true
    }
});;
const canvasGastos = document.getElementById('grafico-gastos');

console.log('Canvas:', canvasGastos);
console.log('Pai do canvas:', canvasGastos.parentElement);
console.log('Card:', canvasGastos.closest('.card-gastos'));
console.log('Altura do contêiner:', canvasGastos.parentElement.clientHeight);
console.log('Largura do card:', canvasGastos.closest('.card-gastos').clientWidth);
console.log('Largura do contêiner:', canvasGastos.parentElement.clientWidth);



const graficoGastos = new Chart(canvasGastos, {
    type: 'bar',

    data: {
        labels: [
            'Alimentação',
            'Transporte',
            'Lazer',
            'Compras',
            'Moradia',
            'Outros'
        ],

        datasets: [{
            label: 'Gastos previstos',
            data: [450, 200, 150, 300, 800, 100],
            backgroundColor: [
                '#a855f7',
                '#9333ea',
                '#7e22ce',
                '#c084fc',
                '#6b21a8',
                '#d8b4fe'
            ],
            borderRadius: 6,
            barThickness: 24
        }]
    },

    options: {
        indexAxis: 'y',

        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                display: false
            }
        },

        scales: {
            x: {
                beginAtZero: true,
                ticks: {
                    callback: function(valor) {
                        return 'R$ ' + valor;
                    }
                }
            }
        }
    }
});



