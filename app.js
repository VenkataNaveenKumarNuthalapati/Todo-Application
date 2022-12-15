const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const sqlite = require("sqlite");
const { open } = sqlite;
const sqlite3 = require("sqlite3");

let db;

let initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, (request, response) => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
initializeDBServer();
////////////////  GET APIS ////////////////////
app.get("/todos/", async (request, response) => {
  try {
    let { status, priority, category, search_q } = request.query;
    console.log(status, priority, category, search_q);
    if (
      status !== undefined &&
      priority === undefined &&
      search_q === undefined &&
      category === undefined
    ) {
      let todosList = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE status = '${status}';`;
      todosList = await db.all(todosList);
      console.log(todosList);
      if (todosList.length !== 0) {
        response.status(200);
        response.send(todosList);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
    } else if (
      status === undefined &&
      priority !== undefined &&
      search_q === undefined &&
      category === undefined
    ) {
      let todosList = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE priority = '${priority}';`;
      todosList = await db.all(todosList);
      if (todosList.length !== 0) {
        response.status(200);
        response.send(todosList);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else if (
      status !== undefined &&
      priority !== undefined &&
      search_q === undefined &&
      category === undefined
    ) {
      let todosList = `select id,todo,priority,status,category,due_date as dueDate from todo where status = '${status}' and priority = '${priority}';`;
      todosList = await db.all(todosList);
      response.status(200);
      response.send(todosList);
    } else if (
      status === undefined &&
      priority === undefined &&
      search_q !== undefined &&
      category === undefined
    ) {
      let todosList = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE todo LIKE '%${search_q}%';`;
      todosList = await db.all(todosList);
      if (todosList.length !== 0) {
        response.status(200);
        response.send(todosList);
      } else {
        response.status(400);
        response.send("Invalid Todo search_q");
      }
    } else if (
      status === undefined &&
      priority === undefined &&
      search_q === undefined &&
      category !== undefined
    ) {
      let todosList = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE category = '${category}';`;
      todosList = await db.all(todosList);
      if (todosList.length !== 0) {
        response.status(200);
        response.send(todosList);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else if (
      status !== undefined &&
      priority === undefined &&
      search_q === undefined &&
      category !== undefined
    ) {
      let todosList = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE category = '${category}' and status = '${status}';`;
      todosList = await db.all(todosList);
      response.status(200);
      response.send(todosList);
    } else if (
      status === undefined &&
      priority !== undefined &&
      search_q === undefined &&
      category !== undefined
    ) {
      let todosList = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE category = '${category}' and priority = '${priority}';`;
      todosList = await db.all(todosList);
      response.status(200);
      response.send(todosList);
    }
  } catch (error) {
    response.status(400);
    response.send(error);
  }
});
////////////////  GET APIS with id params ////////////////////
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let todosList = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE id = '${todoId}';`;
  todosList = await db.get(todosList);
  response.status(200);
  response.send(todosList);
});
//////////////// GET APIS with AGENDA ///////////////////////
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  try {
    let formatedDate = format(new Date(date), "yyyy-MM-dd");
    isValidDate = isValid(new Date(formatedDate));
    if (isValidDate === true) {
      let todoList = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE due_date = '${formatedDate}'`;
      todoList = await db.all(todoList);

      if (todoList.length === 0) {
        response.status(400);
        response.send("No TodoList Found");
      } else {
        response.status(200);
        response.send(todoList);
      }
    }
  } catch (error) {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
/////////////// POST APIS //////////////
app.post("/todos/", async (request, response) => {
  let { id, todo, priority, status, category, dueDate } = request.body;

  if ([`TO DO`, `IN PROGRESS`, `DONE`].includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
    return;
  } else if ([`HIGH`, `MEDIUM`, `LOW`].includes(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
    return;
  } else if ([`WORK`, `HOME`, `LEARNING`].includes(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
    return;
  } else if (isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
    return;
  } else {
    try {
      dueDate = format(new Date(dueDate), "yyyy-MM-dd");
      let insertQuery = `INSERT INTO todo VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
      await db.run(insertQuery);
      response.status(200);
      response.send("Todo Successfully Added");
    } catch (error) {
      response.status(400);
      response.send(error);
    }
  }
});
////////////// POST APIS WITH QUERY,PARAMS //////////
app.put("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  let { status, priority, todo, category, dueDate } = request.body;
  console.log(status, priority, todo, category, dueDate);
  try {
    let isPresentIn = `SELECT * FROM todo WHERE id = ${todoId};`;
    let todoList = await db.get(isPresentIn);

    if (todoList !== undefined) {
      if (
        status !== undefined &&
        priority === undefined &&
        todo === undefined &&
        category === undefined &&
        dueDate === undefined
      ) {
        if (["TO DO", "IN PROGRESS", "DONE"].includes(status)) {
          let putQuery = `UPDATE todo SET status = '${status}'`;
          await db.run(putQuery);
          response.status(200);
          response.send("Status Updated");
          console.log("Status Updated");
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else if (
        status === undefined &&
        priority !== undefined &&
        todo === undefined &&
        category === undefined &&
        dueDate === undefined
      ) {
        if ([`HIGH`, `MEDIUM`, `LOW`].includes(priority)) {
          let putQuery = `UPDATE todo SET priority = '${priority}'`;
          await db.run(putQuery);
          response.status(200);
          response.send("Priority Updated");
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else if (
        status === undefined &&
        priority === undefined &&
        todo !== undefined &&
        category === undefined &&
        dueDate === undefined
      ) {
        let putQuery = `UPDATE todo SET todo = '${todo}'`;
        await db.run(putQuery);
        response.status(200);
        response.send("Todo Updated");
      } else if (
        status === undefined &&
        priority === undefined &&
        todo === undefined &&
        category !== undefined &&
        dueDate === undefined
      ) {
        if ([`WORK`, `HOME`, `LEARNING`].includes(category)) {
          let putQuery = `UPDATE todo SET category = '${category}'`;
          await db.run(putQuery);
          response.status(200);
          response.send("Category Updated");
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else if (
        status === undefined &&
        priority === undefined &&
        todo === undefined &&
        category === undefined &&
        dueDate !== undefined
      ) {
        console.log(dueDate);
        console.log(isValid(new Date(dueDate)));
        console.log(isValid(new Date(dueDate)) === true);
        if (isValid(new Date(dueDate)) === true) {
          dueDate = format(new Date(dueDate), "yyyy-MM-dd");
          let putQuery = `UPDATE todo SET due_date = '${dueDate}'`;
          await db.run(putQuery);
          response.status(200);
          response.send("Due Date Updated");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      }
    } else {
      response.status(400);
      response.send("Todo is Not Present");
    }
  } catch (error) {
    response.status(400);
    response.send(error);
  }
});
////////////// DELETE APIS //////////////////////////
app.delete("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  let istodoPresent = `SELECT * FROM todo WHERE id = ${todoId};`;
  istodoPresent = await db.get(istodoPresent);

  if (istodoPresent !== undefined) {
    let deleteQuery = `DELETE FROM todo WHERE id = ${todoId};`;
    await db.run(deleteQuery);
    response.status(200);
    response.send("Todo Deleted");
  } else {
    response.status(400);
    response.send("Todo is Not Present");
  }
});
module.exports = app;
