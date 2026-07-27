// js/app.js

// 1. Modificación dentro de renderItems():
itemList.forEach(item => {
    const div = document.createElement('div');
    div.className = `flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg ${config.border}`;
    div.innerHTML = `
        <div class="space-y-0.5">
            <p class="font-medium text-sm text-gray-800 dark:text-gray-100">${item.name}</p>
            <p class="text-xs text-gray-400">${item.unit_price_eur.toFixed(2)} €/ud</p>
        </div>
        <div class="flex items-center gap-1.5">
            <button type="button" data-action="decrement" data-id="${item.id}" class="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-md font-bold text-base transition-colors">-</button>
            <input type="number" min="0" value="0" data-id="${item.id}" id="qty-${item.id}" class="item-qty w-12 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-center text-sm font-semibold focus:ring-1 focus:ring-indigo-500">
            <button type="button" data-action="increment" data-id="${item.id}" class="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-md font-bold text-base transition-colors">+</button>
        </div>
    `;
    section.appendChild(div);
});

// 2. Modificación de los Listeners delegados para los botones:
container.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-action');
        const id = e.currentTarget.getAttribute('data-id');
        const input = document.getElementById(`qty-${id}`);
        if (!input) return;

        let currentValue = parseInt(input.value) || 0;
        if (action === 'increment') {
            input.value = currentValue + 1;
        } else if (action === 'decrement' && currentValue > 0) {
            input.value = currentValue - 1;
        }
    });
});