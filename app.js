#!/usr/bin/env node

const package = require('./package.json');
const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const groupBy = require('lodash/groupBy');
const intersection = require('lodash/intersection');
const difference = require('lodash/difference');
const orderBy = require('lodash/orderBy');
const cli = require('cac')()

const workingDir = process.cwd();
const fileDir = path.dirname(__filename);

cli
    .command('<routes>', 'Routes file (JSON)')
    .option('-O, --output <output>', 'Output file', { default: 'routes.html' })
    .option('--title <title>', 'Title', { default: 'Routes' })
    .action((routes, options) => handler(routes, options))

cli.help()
cli.version(package.version)
cli.parse()

function handler(routes, options) {
    const routesFileName = routes.endsWith('.json') ? routes : `${routes}.json`
    const routesFile = path.resolve(workingDir, routesFileName);

    if (!fs.existsSync(routesFile)) {
        console.error(`Routes file not found: ${routesFile}`)
        process.exit(1);
        return;
    }

    const {output, title} = {
        output: 'routes.html',
        title: 'Routes',
        ...options,
    };

    console.log('Routes file:', routesFile);
    const allRoutes = processRoutes(require(routesFile));

    nunjucks.configure(fileDir, { autoescape: true });
    const templateFile = fileDir + '/template.njk';
    let html = nunjucks.render(templateFile, { title, routes: allRoutes }).trim();

    const outputFile = path.resolve(workingDir, output);
    console.log('Output file:', outputFile);
    fs.writeFileSync(outputFile, html);
}


function processRoutes(routes) {
    routes = routes.map(route => ({
        ...route,
        ...getActionNamespace(route),
        methods: route.method.split('|'),
        middlewares: route.middleware.split(/\s/),
    }));
    routes = orderBy(routes, ['part', 'uri', 'methods'])

    const grouped = groupBy(routes, (route) => String(route.part + ' ' + String(route.version || '').trim()));

    return Object.keys(grouped).map(part => {
        const groupRoutes = groupBy(grouped[part], 'subPart');
        const domains = new Set()
        const subPartRoutes = Object.keys(groupRoutes).sort().map(subPart => {
            const partRoutes = groupRoutes[subPart];
            const commonMiddlewares = intersection(...partRoutes.map(route => route.middlewares))

            partRoutes.map(route => route.domain).forEach(domain => domains.add(domain))

            return {
                name: subPart,
                id: strToId(`${part}__${subPart}`),
                partRoutes: partRoutes.map(route => ({
                    ...route,
                    fullURI: `${route.domain}/${route.uri}`,
                    specifiedMiddlewares: difference(route.middlewares, commonMiddlewares)
                })),
                middlewares: commonMiddlewares
            };
        });

        return { name: part, id: strToId(part), domains: Array.from(domains), subParts: subPartRoutes };
    })
}

function getActionNamespace(route) {
    const apiPrefix = 'App\\Http\\Controllers\\Api\\';
    const action = route.action;

    if (!action.startsWith(apiPrefix)) {
        return {
            part: 'Other',
            subPart: 'All',
            version: null,
            sortAction: route.action
        }
    }

    const parts = action.split('\\');

    return {
        part: parts[4],
        version: String(parts[5]).match(/^v\d$/) ? parts[5] : null,
        subPart: String(parts[6]) || 'All',
        sortAction: action.replace(apiPrefix, '<small><i>..API..</i></small>/')
    }
}

function strToId(str) {
    return str.replace(/\s{2,}/g, '__').replace(/\s/g, '-')
}