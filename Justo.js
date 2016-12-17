//imports
const justo = require("justo");
const catalog = justo.catalog;
const apt = require("justo-plugin-apt");
const cli = require("justo-plugin-cli");
const fs = require("justo-plugin-fs");
const sync = require("justo-sync");
const getos = require("getos");

//private data
const PKG = "cassandra";

//catalog
catalog.workflow({name: "install", desc: "Install Apache Cassandra."}, function(params) {
  var os, version = "39";

  //(1) params
  if (params.length >= 1) {
    version = params[0].replace(".", "");
  }

  //(2) get OS info
  os = sync((done) => getos(done));

  if (os.os != "linux")  {
    throw new Error("Distribution not supported by this module.");
  }

  //(3) install
  if (!apt.installed("Check whether Cassandra installed", {name: PKG})) {
    //(3.1) install dependencies for installing
    if (!apt.installed("Check whether cURL installed", {name: "curl"})) {
      apt.install("Install curl package", {name: "curl"});
    }

    //(3.2) add package source if needed
    if (!fs.exists("Check whether /etc/apt/sources.list.d/cassandra.list exists", {src: "/etc/apt/sources.list.d/cassandra.list"})) {
      cli("Create /etc/apt/sources.list.d/cassandra.list", {
        cmd: "bash",
        args: ["-c", `echo "deb http://www.apache.org/dist/cassandra/debian ${version}x main" | tee -a /etc/apt/sources.list.d/cassandra.list`],
      });
    }

    cli("Add APT key", {
      cmd: "bash",
      args: ["-c", "curl https://www.apache.org/dist/cassandra/KEYS | apt-key add -"]
    });

    apt.update("Update APT index");
    if (!apt.available(`Check whether ${PKG} package available`, {name: PKG})) return;

    //(3.3) install Cassandra
    apt.install(`Install ${PKG} from APT`, {
      name: PKG
    });
  }

  //(4) check commands
  cli("Check cassandra command", {
    cmd: "bash",
    args: ["-c", "cassandra -v"]
  });

  cli("Check cassandra-stress command", {
    cmd: "bash",
    args: ["-c", "cassandra-stress help"]
  });

  cli("Check cqlsh command", {
    cmd: "bash",
    args: ["-c", "cqlsh --version"]
  });

  cli("Check sstableloader command", {
    cmd: "bash",
    args: ["-c", "sstableloader -h"]
  });

  cli("Check nodetool command", {
    cmd: "bash",
    args: ["-c", "nodetool help"]
  });
});

catalog.macro({name: "default", desc: "Install Cassandra and its dependencies."}, ["install"]);
