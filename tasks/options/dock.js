var fs = require('fs'),
    path = require('path');

module.exports = function() {
  var userHome = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

  var caPath   = path.resolve(userHome, '.boot2docker/certs/boot2docker-vm/', 'ca.pem'),
      certPath = path.resolve(userHome, '.boot2docker/certs/boot2docker-vm/', 'cert.pem'),
      keyPath  = path.resolve(userHome, '.boot2docker/certs/boot2docker-vm/', 'key.pem');

  return {

    options: {

      docker: {
        version: 'v1.15',
        protocol: 'https',
        host: '192.168.59.103',
        port: '2376',

        ca: fs.readFileSync(caPath),
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath)
      }
    },

    dev: {

      options: {

        images: {

          'node': {
            dockerfile: 'contianers/DockerNode',

            options: {

              // A startup, bind the 8080 port to the host
              // Bind the directory 'bundle/node' into the directory container '/bundle'
              start:  {
                "PortBindings": { "8080/tcp": [ { "HostPort": "8080" } ] },
                "Binds":[
                  __dirname + "/bundle/node:/bundle"
                ]
              },

              // For logs, only stdout
              logs:   { stdout: true }
            }
          },

          'nginx': {
            dockerfile: 'containers/DockerNginx',

            options: {

              // Bind the 80 port to the host 8081
              // Links this container to the node one. So Docker env variable will be accessible
              // Bind 2 directories to the container (config, NGINX startup script, default index.html file)
              start:  {
                "PortBindings": { "80/tcp": [ { "HostPort": "8081" } ] },
                "Links": [ "node:latest" ],
                "Binds":[
                  __dirname + "/bundle/nginx:/bundle",
                  __dirname + "/bundle/nginx:/etc/nginx/sites-available",
                ]
              },

              // For logs, sdtout & stderr
              logs:   { stdout: true, stderr: true }
            }
          }
        }
      }
    }
  };

};
