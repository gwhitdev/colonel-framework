import { Router, redirect } from '@coloneldev/framework';

const web = new Router();

// Define any redirects here
web.get('/favicon.ico', () => redirect('/favicon.png', 301));

// Define your web routes here
web.get('/health', () => new Response("OK", { status: 200 }));

web.get('/', 'AppController@index');

web.group('/users', (users) => {
	users.get('/', 'UserController@index');
	users.get('/:id', 'UserController@show');
});

export default web;