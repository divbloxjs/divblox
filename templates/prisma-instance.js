import { PrismaClient } from "@prisma/client";
global.prisma;

BigInt.prototype.toJSON = function () {
    const int = Number.parseInt(this?.toString());
    return int ?? this?.toString();
};

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === "development") {
    global.prisma = prisma;
}

export { prisma };
