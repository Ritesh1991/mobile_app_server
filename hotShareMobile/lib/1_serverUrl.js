server_domain_name = "cdn.tiegushi.com";
if (withZhiFaCDN) {
  server_domain_name = "cdcdn.tiegushi.com:8080";
}
chat_server_url = 'chat.tiegushi.com';
//import_server_url = 'urlanalyser.tiegushi.com';
import_server_url = 'http://urlanalyser.tiegushi.com:8080/import';
import_cancel_url = 'http://urlanalyser.tiegushi.com:8080/import-cancel';
IMPORT_SERVER_PORT = 8080;
rest_api_url = "http://"+server_domain_name;
theme_host_url = 'http://cdcdn.tiegushi.com';