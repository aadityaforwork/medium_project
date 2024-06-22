import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const authHeader = c.req.header("Authorization") || "";
  const user = await verify(authHeader, c.env.JWT_SECRET);
  if (user) {
    //@ts-ignore
    c.set("userId", user.id);
    await next();
  } else {
    c.status(403);
    return c.json({ error: "Unauthorized" });
  }
});

blogRouter.post("/", async (c) => {
    const userId = c.get('userId');
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const post = await prisma.post.create({
		data: {
			title: body.title,
			content: body.content,
			authorId: userId
		}
	});
	return c.json({
		id: post.id
	});
});

blogRouter.put("/", async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const blog = await prisma.post.update({
		where: {
			id: body.id
		},
		data: {
			title: body.title,
			content: body.content
		}
	});

	return c.json({
		id: blog.id
	});
});

blogRouter.get("/bulk", async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
      const posts = await prisma.post.findMany({});
      return c.json({
        posts,
      });
    } catch (e) {
      c.status(403);
      return c.json({ error: "error while creating blog" });
    }
  });
  

blogRouter.get("/:id", async (c) => {
    const id = c.req.param('id');
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());
	
	const post = await prisma.post.findFirst({
		where: {
			id
		}
	});

	return c.json(post);
});

