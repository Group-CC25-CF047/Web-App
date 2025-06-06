export interface IJoiFileObject {
    file: {
        _data: Buffer;
        _encoding: string;
        hapi: {
            filename: string;
            headers: Record<string, string>;
        };
    };
}
