require('dotenv').config();
const { Shopify, ApiVersion, DataType } = require('@shopify/shopify-api');
Shopify.Context.API_VERSION = ApiVersion.October22;

const client = new Shopify.Clients.Rest(process.env.STORE_DOMAIN, process.env.ADMIN_API_TOKEN);


async function shopifyFetch(client, path, queryList = []) {
	let allObjects = [];
    let objects = 0;
	let newObject;
	let nextPageQuery = {
		limit: 250,
	};

	for (const query of queryList) {
		nextPageQuery[query.split('=')[0]] = query.split('=')[1];
	}
    
    let bodyPath = path;
    if(path.includes('/')){
        bodyPath = path.split('/')[0];
    }

    while (nextPageQuery) {
        console.log('request sent');
        objects += 250;
        console.log('fetched: '+ objects +", " + objects/48000*100 + "%");
        const response = await client.get({
            path: path,
            query: nextPageQuery,
        })
        newObject = response.body[bodyPath];
        allObjects.push(...newObject);
        nextPageQuery = response?.pageInfo?.nextPage?.query;
    }

	return allObjects;
}

async function setMarketingOn(id) {
	let customer = {
        id: `${id}`,
		accepts_marketing: true
	};

    const body = { customer };
	const response = await client
		.put({
			path: `customers/${id}`,
			data: body,
			type: DataType.JSON
		})

    console.log(response);
	const sleep = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));
	await sleep(1000);
}


async function main() {
    console.log('\x1b[31m%s\x1b[0m', '\n==========================================');
	console.log('\x1b[31m%s\x1b[0m', '=========== Customers Program ============');
	console.log('\x1b[31m%s\x1b[0m', '==========================================');

    console.log('\x1b[36m%s\x1b[0m', '\nScript started');

    console.log('\x1b[33m%s\x1b[0m', 'ֿ\nFetching Shopify customers...');
    const customers = await shopifyFetch(client, 'customers/search', ['accepts_marketing=false']);

    console.log(customers);
    console.log('\x1b[32m%s\x1b[0m', '\nFetched Shopify customers');

    let counter = 0;
    for(const customer of customers) {
        if(!customer.accepts_marketing){
            counter += 1;
            await setMarketingOn(customer.id);
       }
    }
    console.log(counter);
}

main();